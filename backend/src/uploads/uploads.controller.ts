import { BadRequestException, Controller, Param, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AllowUnverified } from '../common/decorators/public.decorator.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { MAX_UPLOAD_BYTES } from './image-validation.js';
import { UPLOAD_PURPOSES, UploadsService, type UploadPurpose } from './uploads.service.js';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploads: UploadsService) {}

  @AllowUnverified()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Post('images/:purpose')
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }))
  upload(
    @CurrentUser() user: AuthUser,
    @Param('purpose') purpose: string,
    @UploadedFile() file: Express.Multer.File | undefined,
  ) {
    if (!UPLOAD_PURPOSES.includes(purpose as UploadPurpose)) {
      throw new BadRequestException({ code: 'INVALID_PURPOSE', message: 'Invalid upload purpose' });
    }
    return this.uploads.uploadImage(user.id, file, purpose as UploadPurpose);
  }
}
