import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { Listing } from 'src/core/types/all.types';

interface PlaceBidDto {
  listingPublicKey: string;
  amount: number;
  offeredPrice: number;
}


@Controller('api/marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('place-bid')
  async placeBid(@Body() body: PlaceBidDto): Promise<Listing> {
    try {
      const { listingPublicKey, amount, offeredPrice } = body;
      const updatedListing = await this.marketplaceService.placeBid(
        listingPublicKey,
        amount,
        offeredPrice
      );
      return updatedListing;
    } catch (error) {
      throw new HttpException(
        `Failed to place bid: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('listings')
  async getListings(): Promise<Listing[]> {
    return this.marketplaceService.getListings();
  }
}