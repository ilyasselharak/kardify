import { Controller, ForbiddenException, Get, NotFoundException, Param, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { Public } from '../common/decorators/public.decorator.js';
import { CvPdfService, pdfDisposition } from './cv-pdf.service.js';
import { CvService } from './cv.service.js';
import { CvPdfQueryDto } from './dto/cv.dto.js';

/**
 * Anonymous CV access. Responses are never cached (`no-store`): a CV switched to private must
 * disappear immediately, from browsers and shared caches alike.
 */
@ApiTags('Public CV')
@Public()
@Controller('public/cvs/:slug')
export class PublicCvController {
  constructor(
    private readonly cvs: CvService,
    private readonly pdf: CvPdfService,
  ) {}

  @Get()
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async get(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    const { cvId: _id, version: _v, ...cv } = await this.cvs.getPublic(slug);
    res.setHeader('Cache-Control', 'no-store');
    if (!cv.indexable) res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return cv;
  }

  @Get('pdf')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async downloadPdf(@Param('slug') slug: string, @Query() query: CvPdfQueryDto, @Res() res: Response) {
    const cv = await this.cvs.getPublic(slug);
    if (!cv.allowDownload) throw new ForbiddenException({ code: 'CV_DOWNLOAD_DISABLED', message: 'The owner has disabled downloads' });
    const doc = cv.document;
    const bytes = await this.pdf.render(cv.cvId, cv.version, doc.language);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', pdfDisposition(doc.profile.fullName || 'CV', !!query.download));
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex');
    res.send(bytes);
  }
}

/** Read endpoint for the web app's print route, authorised by a 2-minute render token. */
@ApiTags('Public CV')
@Public()
@SkipThrottle()
@Controller('cv-render')
export class CvRenderController {
  constructor(
    private readonly cvs: CvService,
    private readonly pdf: CvPdfService,
  ) {}

  @Get(':token')
  async document(@Param('token') token: string, @Res({ passthrough: true }) res: Response) {
    const cvId = await this.pdf.verifyRenderToken(token);
    if (!cvId) throw new NotFoundException({ code: 'CV_NOT_FOUND', message: 'CV not found' });
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    return this.cvs.getDocument(cvId);
  }
}
