import { Controller, Delete, Get, HttpCode, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { SessionsService } from './sessions.service.js';

@ApiTags('Sessions')
@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get()
  async list(@CurrentUser() user: AuthUser) {
    const sessions = await this.sessions.list(user.id);
    return sessions.map((s) => ({ ...s, current: s.id === user.sessionId }));
  }

  @Delete(':id')
  @HttpCode(204)
  revoke(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.sessions.revoke(user.id, id);
  }

  /** Logs out every other device; the current session stays active. */
  @Post('revoke-others')
  @HttpCode(204)
  revokeOthers(@CurrentUser() user: AuthUser) {
    return this.sessions.revokeAll(user.id, user.sessionId);
  }
}
