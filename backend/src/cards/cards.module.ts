import { Global, Module } from '@nestjs/common';
import { WalletSyncModule } from '../wallet/wallet-sync.module.js';
import { CardsController } from './cards.controller.js';
import { CardsService } from './cards.service.js';

@Global()
@Module({
  imports: [WalletSyncModule],
  controllers: [CardsController],
  providers: [CardsService],
  exports: [CardsService],
})
export class CardsModule {}
