import { Controller, Get, Inject } from '@nestjs/common';
import { IotDataService } from './iot-data.service';

@Controller('api/iot-data')
export class IotDataController {
  constructor() {}

  @Inject()
  private readonly iotDataService: IotDataService;

  @Get('processed')
  getProcessedData() {
    return this.iotDataService.getProcessedData();
  }
}