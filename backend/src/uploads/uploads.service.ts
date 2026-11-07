import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';
import sharp from 'sharp';
import { AppConfig } from '../config/app-config.js';
import { detectImageType, MAX_UPLOAD_BYTES } from './image-validation.js';

export const UPLOAD_PURPOSES = ['avatar', 'profile', 'logo'] as const;
export type UploadPurpose = (typeof UPLOAD_PURPOSES)[number];

const SIZES: Record<UploadPurpose, number> = { avatar: 512, profile: 800, logo: 800 };

@Injectable()
export class UploadsService {
  constructor(private readonly config: AppConfig) {
    const c = config.cloudinary;
    if (c) cloudinary.config({ cloud_name: c.cloudName, api_key: c.apiKey, api_secret: c.apiSecret, secure: true });
  }

  async uploadImage(userId: string, file: Express.Multer.File | undefined, purpose: UploadPurpose) {
    const c = this.config.cloudinary;
    if (!c) throw new ServiceUnavailableException({ code: 'UPLOADS_DISABLED', message: 'Image uploads are not configured' });
    if (!file) throw new BadRequestException({ code: 'FILE_REQUIRED', message: 'File is required' });
    if (file.size > MAX_UPLOAD_BYTES) throw new BadRequestException({ code: 'FILE_TOO_LARGE', message: 'Max 5 MB' });
    if (!detectImageType(file.buffer)) {
      throw new BadRequestException({ code: 'FILE_TYPE', message: 'Only JPEG, PNG or WebP images are allowed' });
    }

    // Re-encode: strips EXIF/GPS metadata, neutralises polyglot payloads and optimises size.
    const size = SIZES[purpose];
    let optimised: Buffer;
    try {
      optimised = await sharp(file.buffer, { limitInputPixels: 40_000_000 })
        .rotate()
        .resize(size, size, { fit: purpose === 'logo' ? 'inside' : 'cover', withoutEnlargement: true })
        .webp({ quality: 86 })
        .toBuffer();
    } catch {
      throw new BadRequestException({ code: 'FILE_TYPE', message: 'Invalid image' });
    }

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder: `${c.folder}/${userId}/${purpose}`, resource_type: 'image', format: 'webp', overwrite: false },
          (err, res) => (err || !res ? reject(err ?? new Error('Upload failed')) : resolve(res)),
        )
        .end(optimised);
    });
    return { url: result.secure_url, width: result.width, height: result.height };
  }
}
