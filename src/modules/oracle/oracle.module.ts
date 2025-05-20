import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/infrastracture/prisma/prisma.module';
import { OracleController } from './oracle.controller';
import { OracleService } from './oracle.service';
import { MarketplaceModule } from '../marketplace/marketplace.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [OracleController],
  providers: [OracleService],
  exports: [OracleService],
})
export class OracleModule {}
