import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { CvPdfService, pdfDisposition } from './cv-pdf.service.js';
import { CvService } from './cv.service.js';
import { CreateCvDto, CvPdfQueryDto, UpdateCvDto, UpdateCvProfileDto, UpdateCvSharingDto } from './dto/cv.dto.js';

@ApiTags('CV')
@Controller()
export class CvController {
  constructor(
    private readonly cvs: CvService,
    private readonly pdf: CvPdfService,
  ) {}

  @Get('cv-profile')
  profile(@CurrentUser() user: AuthUser) {
    return this.cvs.getProfile(user.id);
  }

  @Patch('cv-profile')
  updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateCvProfileDto) {
    return this.cvs.updateProfile(user.id, dto);
  }

  @Get('cvs')
  list(@CurrentUser() user: AuthUser) {
    return this.cvs.list(user.id);
  }

  @Post('cvs')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCvDto) {
    return this.cvs.create(user.id, dto);
  }

  @Get('cvs/:id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cvs.get(user.id, id);
  }

  /** Autosave: metadata, design and/or whole content collections. */
  @Patch('cvs/:id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCvDto) {
    return this.cvs.update(user.id, id, dto);
  }

  @Delete('cvs/:id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cvs.remove(user.id, id);
  }

  @Post('cvs/:id/duplicate')
  duplicate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cvs.duplicate(user.id, id);
  }

  @Patch('cvs/:id/sharing')
  sharing(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCvSharingDto) {
    return this.cvs.updateSharing(user.id, id, dto);
  }

  @Get('cvs/:id/slug-available')
  slugAvailable(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query('slug') slug = '') {
    return this.cvs.slugAvailable(user.id, id, String(slug).slice(0, 80));
  }

  /** The owner can always download their own CV, whatever its visibility. */
  @Get('cvs/:id/pdf')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  async downloadPdf(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: CvPdfQueryDto,
    @Res() res: Response,
  ) {
    const cv = await this.cvs.findOwned(user.id, id);
    const profile = await this.cvs.ensureProfile(user.id);
    const bytes = await this.pdf.render(cv.id, `${cv.updatedAt.getTime()}-${profile.updatedAt.getTime()}`, cv.language);
    res.setHeader('Content-Type', 'application/pdf');
    const name = cv.fullName || profile.fullName;
    res.setHeader('Content-Disposition', pdfDisposition(name ? `${name} - ${cv.title}` : cv.title, !!query.download));
    res.setHeader('Cache-Control', 'private, no-store');
    res.send(bytes);
  }
}
