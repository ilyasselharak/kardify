import { Module } from '@nestjs/common';
import { AppleWalletController } from './apple-wallet.controller.js';
import { AppleWalletService } from './apple-wallet.service.js';

@Module({ controllers: [AppleWalletController], providers: [AppleWalletService], exports: [AppleWalletService] })
export class AppleWalletModule {}
