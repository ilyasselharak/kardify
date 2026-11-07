import { Body, Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';
import { AdminCardsQueryDto, AdminUpdateUserDto, AdminUsersQueryDto, PageQueryDto } from './dto/admin.dto.js';

@ApiTags('Admin')
@UseGuards(AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get('stats')
  stats() {
    return this.admin.stats();
  }

  @Get('users')
  users(@Query() q: AdminUsersQueryDto) {
    return this.admin.listUsers(q);
  }

  @Get('users/:id')
  user(@Param('id', ParseUUIDPipe) id: string) {
    return this.admin.getUser(id);
  }

  @Patch('users/:id')
  updateUser(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AdminUpdateUserDto) {
    return this.admin.updateUser(me, id, dto);
  }

  @Post('users/:id/suspend')
  @HttpCode(200)
  suspend(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setSuspended(me, id, true);
  }

  @Post('users/:id/unsuspend')
  @HttpCode(200)
  unsuspend(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setSuspended(me, id, false);
  }

  @Post('users/:id/revoke-sessions')
  @HttpCode(204)
  revokeSessions(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.revokeSessions(me, id);
  }

  @Delete('users/:id')
  @HttpCode(204)
  deleteUser(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteUser(me, id);
  }

  @Get('cards')
  cards(@Query() q: AdminCardsQueryDto) {
    return this.admin.listCards(q);
  }

  @Post('cards/:id/activate')
  @HttpCode(200)
  activate(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setCardStatus(me, id, true);
  }

  @Post('cards/:id/deactivate')
  @HttpCode(200)
  deactivate(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.setCardStatus(me, id, false);
  }

  @Delete('cards/:id')
  @HttpCode(204)
  deleteCard(@CurrentUser() me: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.admin.deleteCard(me, id);
  }

  @Get('audit-log')
  auditLog(@Query() q: PageQueryDto) {
    return this.admin.auditLog(q);
  }
}
