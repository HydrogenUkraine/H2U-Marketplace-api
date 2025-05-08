// src/iot-data/iot-data.module.ts
import { Module } from '@nestjs/common';
import { IotDataService } from './iot-data.service';
import { IotDataController } from './iot-data.controller';

@Module({
  controllers: [IotDataController],
  providers: [IotDataService],
})
export class IotDataModule {}