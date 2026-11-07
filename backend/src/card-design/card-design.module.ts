import { Global, Module } from '@nestjs/common';
import { CardDesignController } from './card-design.controller.js';
import { CardDesignService } from './card-design.service.js';

@Global()
@Module({ controllers: [CardDesignController], providers: [CardDesignService], exports: [CardDesignService] })
export class CardDesignModule {}
