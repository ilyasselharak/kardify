import { Controller, Get, Param, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CardsService } from '../cards/cards.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { publicCardUrl } from '../cards/card.mapper.js';
import { AppConfig } from '../config/app-config.js';
import { buildShareLinks } from './share-links.js';

@ApiTags('Sharing')
@Controller('cards/:id/share')
export class SharingController {
  constructor(
    private readonly cards: CardsService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  async links(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    const card = await this.cards.findOwned(user.id, id);
    return buildShareLinks(publicCardUrl(this.config.frontendUrl, card.slug), card.language, card.name);
  }
}
