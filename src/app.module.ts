import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PrivyModule } from './infrastracture/privy/privy.module';
import { PrivyModuleOptions } from './infrastracture/privy/types/privy.types';
import { IotDataModule } from './modules/iot-data/iot-data.module';
import { MarketplaceModule } from './modules/marketplace/marketplace.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    IotDataModule,
    MarketplaceModule,
    PrivyModule.registerAsync({
      useFactory: async (
        configService: ConfigService,
      ): Promise<PrivyModuleOptions> => ({
        applicationId: configService.get<string>('PRIVY_APP_ID') || '',
        secret: configService.get<string>('PRIVY_SECRET') || '',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AppModule {}

