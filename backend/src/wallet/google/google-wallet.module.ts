import { Module } from '@nestjs/common';
import { GoogleWalletController } from './google-wallet.controller.js';
import { GoogleWalletService } from './google-wallet.service.js';

@Module({ controllers: [GoogleWalletController], providers: [GoogleWalletService], exports: [GoogleWalletService] })
export class GoogleWalletModule {}
