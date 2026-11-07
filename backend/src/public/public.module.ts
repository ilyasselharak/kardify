import { Global, Module } from '@nestjs/common';
import { PublicController } from './public.controller.js';
import { PublicService } from './public.service.js';

@Global()
@Module({ controllers: [PublicController], providers: [PublicService], exports: [PublicService] })
export class PublicModule {}
