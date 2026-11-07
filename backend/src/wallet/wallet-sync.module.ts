import { Module } from '@nestjs/common';
import { AppleWalletModule } from './apple/apple-wallet.module.js';
import { GoogleWalletModule } from './google/google-wallet.module.js';
import { WalletSyncService } from './wallet-sync.service.js';

@Module({
  imports: [AppleWalletModule, GoogleWalletModule],
  providers: [WalletSyncService],
  exports: [WalletSyncService],
})
export class WalletSyncModule {}
