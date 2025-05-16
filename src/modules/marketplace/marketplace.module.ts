import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { PrismaModule } from 'src/infrastracture/prisma/prisma.module';
import { MarketplaceController } from './marketplace.controller';
import { PrivyModule } from 'src/infrastracture/privy/privy.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
