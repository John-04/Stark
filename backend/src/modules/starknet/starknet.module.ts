import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { StarknetController } from './starknet.controller';
import { StarknetService } from './starknet.service';
import { StarknetGateway } from './starknet.gateway';

@Module({
  imports: [HttpModule],
  controllers: [StarknetController],
  providers: [StarknetService, StarknetGateway],
})
export class StarknetModule {}
