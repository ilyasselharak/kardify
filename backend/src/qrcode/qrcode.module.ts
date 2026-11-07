import { Global, Module } from '@nestjs/common';
import { QrCodeController } from './qrcode.controller.js';
import { QrCodeService } from './qrcode.service.js';

@Global()
@Module({ controllers: [QrCodeController], providers: [QrCodeService], exports: [QrCodeService] })
export class QrCodeModule {}
