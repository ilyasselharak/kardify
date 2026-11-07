import { Module } from '@nestjs/common';
import { SharingController } from './sharing.controller.js';

@Module({ controllers: [SharingController] })
export class SharingModule {}
