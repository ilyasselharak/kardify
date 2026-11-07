import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { CardsService } from './cards.service.js';
import { CreateCardDto, ListCardsQueryDto, QrSettingsDto, UpdateCardDto } from './dto/card.dto.js';

@ApiTags('Cards')
@Controller('cards')
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListCardsQueryDto) {
    return this.cards.list(user.id, query);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCardDto) {
    return this.cards.create(user.id, dto);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.get(user.id, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateCardDto) {
    return this.cards.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.remove(user.id, id);
  }

  @Post(':id/duplicate')
  duplicate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.duplicate(user.id, id);
  }

  @Post(':id/publish')
  @HttpCode(200)
  publish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.setStatus(user.id, id, true);
  }

  @Post(':id/unpublish')
  @HttpCode(200)
  unpublish(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.setStatus(user.id, id, false);
  }

  @Patch(':id/qr-settings')
  qrSettings(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: QrSettingsDto) {
    return this.cards.updateQrSettings(user.id, id, dto);
  }

  @Post(':id/regenerate-link')
  @HttpCode(200)
  regenerate(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.cards.regenerateSlug(user.id, id);
  }
}
