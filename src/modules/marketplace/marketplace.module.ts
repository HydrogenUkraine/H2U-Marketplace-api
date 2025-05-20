import { Module } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { PrismaModule } from 'src/infrastracture/prisma/prisma.module';
import { MarketplaceController } from './marketplace.controller';
import { PrivyModule } from 'src/infrastracture/privy/privy.module';
import { OracleModule } from '../oracle/oracle.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, OracleModule, AuthModule],
  controllers: [MarketplaceController],
  providers: [MarketplaceService],
  exports: [MarketplaceService],
})
export class MarketplaceModule {}
