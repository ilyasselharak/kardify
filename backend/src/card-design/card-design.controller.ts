import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { CardDesignService } from './card-design.service.js';

@ApiTags('Card design')
@Controller('card-design')
export class CardDesignController {
  constructor(private readonly design: CardDesignService) {}

  @Public()
  @Get('templates')
  templates() {
    return this.design.listTemplates();
  }
}
