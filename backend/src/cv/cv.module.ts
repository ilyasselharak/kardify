import { Module } from '@nestjs/common';
import { CvPdfService } from './cv-pdf.service.js';
import { CvController } from './cv.controller.js';
import { CvService } from './cv.service.js';
import { CvRenderController, PublicCvController } from './public-cv.controller.js';

@Module({
  controllers: [CvController, PublicCvController, CvRenderController],
  providers: [CvService, CvPdfService],
  exports: [CvService],
})
export class CvModule {}
