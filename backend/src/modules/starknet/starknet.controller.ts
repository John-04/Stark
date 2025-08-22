import { Controller, Get, Param, Post, Body } from '@nestjs/common';
import { StarknetService } from './starknet.service';

@Controller('starknet')
export class StarknetController {
  constructor(private readonly starknetService: StarknetService) {}

  @Get('contract/:address')
  async getContractData(@Param('address') address: string) {
    return this.starknetService.getContractData(address);
  }

  @Post('query')
  async executeQuery(@Body('query') query: string) {
    return this.starknetService.executeQuery(query);
  }

  @Get('health')
  async getHealth() {
    return this.starknetService.getHealth();
  }
}
