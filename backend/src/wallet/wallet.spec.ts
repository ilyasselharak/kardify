import forge from 'node-forge';
import type { AppConfig } from '../config/app-config.js';
import type { BusinessCard, WalletPass } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { AppleWalletService } from './apple/apple-wallet.service.js';
import { GoogleWalletService } from './google/google-wallet.service.js';
import { hexToRgb, passAuthToken, readPem } from './wallet.utils.js';

const card = {
  id: 'c1',
  name: 'Jane Doe',
  slug: 'jane-doe-abc123',
  publicId: 'pub123',
  jobTitle: 'CTO',
  companyName: 'Acme',
  description: 'Hello',
  profileImage: null,
  companyLogo: null,
  email: 'jane@acme.com',
  phone: '+1 555 0100',
  whatsapp: null,
  website: 'https://acme.com',
  address: null,
  mapsUrl: null,
  socialLinks: [],
  designSettings: { backgroundColor: '#0d1e37', textColor: '#ffffff', primaryColor: '#006afe' },
  status: 'ACTIVE',
  language: 'en',
} as unknown as BusinessCard;

function selfSigned() {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date(Date.now() + 86_400_000);
  const attrs = [{ name: 'commonName', value: 'Pass Type ID: pass.com.kardify.test' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());
  return { cert: forge.pki.certificateToPem(cert), key: forge.pki.privateKeyToPem(keys.privateKey) };
}

describe('wallet utils', () => {
  it('converts hex colours to Apple rgb()', () => {
    expect(hexToRgb('#006afe')).toBe('rgb(0, 106, 254)');
    expect(hexToRgb('nope')).toBe('rgb(13, 30, 55)');
  });
  it('reads escaped and base64 PEMs', () => {
    const pem = '-----BEGIN CERTIFICATE-----\nAAA\n-----END CERTIFICATE-----';
    expect(readPem(pem.replace(/\n/g, '\\n'))).toBe(pem);
    expect(readPem(Buffer.from(pem).toString('base64'))).toBe(pem);
  });
  it('derives stable, secret-dependent pass auth tokens', () => {
    expect(passAuthToken('s', 'serial')).toBe(passAuthToken('s', 'serial'));
    expect(passAuthToken('s', 'serial')).not.toBe(passAuthToken('other', 'serial'));
  });
});

describe('AppleWalletService', () => {
  it('produces a signed .pkpass zip containing pass.json, manifest and signature', async () => {
    const { cert, key } = selfSigned();
    const config = {
      apple: {
        passTypeIdentifier: 'pass.com.kardify.test',
        teamIdentifier: 'ABCDE12345',
        wwdr: cert,
        signerCert: cert,
        signerKey: key,
        organizationName: 'Kardify',
        apnsHost: 'https://api.sandbox.push.apple.com',
      },
      frontendUrl: 'https://kardify.com',
      apiPublicUrl: 'https://api.kardify.com',
      jwtSecret: 'secret',
    } as unknown as AppConfig;
    const svc = new AppleWalletService({} as PrismaService, config);
    const buf = await svc.buildPass(card, { serialNumber: 'kdf-1' } as WalletPass);
    expect(buf.subarray(0, 2).toString()).toBe('PK');
    const text = buf.toString('latin1');
    for (const name of ['pass.json', 'manifest.json', 'signature', 'icon.png', 'logo.png']) expect(text).toContain(name);
  }, 30_000);
});

describe('GoogleWalletService.buildObject', () => {
  it('maps a card to a Generic Object with QR code and links', () => {
    const config = {
      google: { issuerId: '3388000000012345678', clientEmail: 'x@y.iam.gserviceaccount.com', privateKey: 'k', classSuffix: 'kardify_v1', origins: [] },
      frontendUrl: 'https://kardify.com',
    } as unknown as AppConfig;
    const svc = new GoogleWalletService({} as PrismaService, config);
    const obj = svc.buildObject(card);
    expect(obj.id).toBe('3388000000012345678.card_pub123');
    expect(obj.classId).toBe('3388000000012345678.kardify_v1');
    expect(obj.state).toBe('ACTIVE');
    expect(obj.header.defaultValue.value).toBe('Jane Doe');
    expect(obj.barcode).toMatchObject({ type: 'QR_CODE', value: 'https://kardify.com/card/jane-doe-abc123?src=qr' });
    expect(obj.textModulesData.map((m) => m.id)).toEqual(['company', 'phone', 'email', 'website', 'about']);
    expect(obj.logo.sourceUri.uri).toBe('https://kardify.com/brand/kardify-mark.png');
  });
});
