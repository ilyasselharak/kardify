import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { AnalyticsService } from './analytics.service.js';
import { RangeQueryDto } from './dto/analytics.dto.js';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@CurrentUser() user: AuthUser, @Query() q: RangeQueryDto) {
    return this.analytics.overview(user.id, q.range ?? '30d');
  }

  @Get('cards/:cardId')
  card(@CurrentUser() user: AuthUser, @Param('cardId', ParseUUIDPipe) cardId: string, @Query() q: RangeQueryDto) {
    return this.analytics.card(user.id, cardId, q.range ?? '30d');
  }
}
