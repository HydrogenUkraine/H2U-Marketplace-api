import { Controller, Get, HttpStatus, HttpException, Post, Body, UseGuards } from '@nestjs/common';
import { OracleService } from './oracle.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/oracle')
@UseGuards(JwtAuthGuard)
export class OracleController {
  constructor(private readonly oracleService: OracleService) {}

  /**
   * Fetches the current oracle price data. Initializes the oracle config if it doesn't exist.
   * @returns The current oracle price data including minPricePerKg, maxPricePerKg, and lastUpdated timestamp.
   * @throws HttpException if fetching or initializing fails.
   */
  @Get('price')
  async getOraclePrice() {
    try {
      const priceData = await this.oracleService.getOraclePrice();
      return {
        statusCode: HttpStatus.OK,
        data: priceData,
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to fetch oracle price',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Updates the oracle price with new minimum and maximum prices per kilogram.
   * @param body - Object containing newMin and newMax prices.
   * @returns A success message upon successful update.
   * @throws HttpException if the update fails or inputs are invalid.
   */
  @Post('price')
  async updateOraclePrice(@Body() body: { newMin: number; newMax: number }) {
    const { newMin, newMax } = body;

    // Validate inputs
    if (!Number.isInteger(newMin) || !Number.isInteger(newMax)) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'newMin and newMax must be integers',
        },
        HttpStatus.BAD_REQUEST
      );
    }

    if (newMin < 0 || newMax < 0) {
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'newMin and newMax must be non-negative',
        },
        HttpStatus.BAD_REQUEST
      );
    }

    try {
      await this.oracleService.updateOraclePrice(newMin, newMax);
      return {
        statusCode: HttpStatus.OK,
        message: 'Oracle price updated successfully',
      };
    } catch (error) {
      throw new HttpException(
        {
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Failed to update oracle price',
          error: error.message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}