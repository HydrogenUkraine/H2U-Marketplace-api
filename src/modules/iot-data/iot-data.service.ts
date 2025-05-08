import { Injectable } from '@nestjs/common';

const ELECTRICITY_PER_KG_H2 = 60; 

@Injectable()
export class IotDataService {

  private getMockData() {
    return [
      {
        organizationId: 'org-001',
        organizationName: 'Green Energy Co.',
        burnedKwts: 1200,
      },
      {
        organizationId: 'org-002',
        organizationName: 'HydroFuture Inc.',
        burnedKwts: 800,
      },
      {
        organizationId: 'org-003',
        organizationName: 'Solaris Ltd.',
        burnedKwts: 1500,
      },
    ];
  }

  //emulate call to blockchain to register/fetch h2 canister based on burned kilowhatts
  async getProcessedData() {
    const rawData = this.getMockData();
    return rawData.map((entry, index) => {
      const availableHydrogenKg = Math.floor(entry.burnedKwts / ELECTRICITY_PER_KG_H2);
      return {
        eacId: `eac-${index + 1}`,
        organizationId: entry.organizationId,
        organizationName: entry.organizationName,
        availableHydrogenKg,
        productionDate: new Date().toISOString(),
        pricePerKg: 15 + (index * 2), // Example pricing logic
      };
    });
  }
}