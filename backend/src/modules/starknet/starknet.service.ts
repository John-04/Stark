import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { RpcProvider, Contract } from 'starknet';
import { firstValueFrom } from 'rxjs';
import * as starknet from 'starknet';

@Injectable()
export class StarknetService {
  private readonly provider: RpcProvider;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    const nodeUrl = this.configService.get<string>('STARKNET_RPC_URL');
    this.provider = new RpcProvider({
      nodeUrl,
    });
  }

  async executeQuery(query: string) {
    const rpcUrl = this.configService.get<string>('STARKNET_RPC_URL');
    if (!rpcUrl) {
      throw new Error('STARKNET_RPC_URL is not defined');
    }
    try {
      const response = await firstValueFrom(
        this.httpService.post(rpcUrl, {
          jsonrpc: '2.0',
          method: 'starknet_call',
          params: [
            {
              contract_address:
                '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
              entry_point_selector:
                '0x0361458367e696363fbcc70777d0c70f7cf410932ab37d9a53d920fa56551b',
              calldata: [],
            },
            'latest',
          ],
          id: 0,
        }),
      );
      return response.data;
    } catch (error) {
      console.error('Error executing query:', error);
      throw new Error('Failed to execute query');
    }
  }

  async getContractData(address: string) {
    try {
      const { abi: abi } = await this.provider.getClassAt(address);
      if (abi === undefined) {
        throw new Error('ABI not found');
      }
      const contract = new Contract(abi, address, this.provider);
      const events = await contract.getEvents();
      return {
        address,
        eventCount: events.length,
        firstEvent: events.length > 0 ? events[0] : null,
        lastEvent: events.length > 0 ? events[events.length - 1] : null,
        events,
      };
    } catch (error) {
      console.error('Error fetching contract data:', error);
      throw new Error('Failed to fetch contract data');
    }
  }

  async getHealth() {
    try {
      await this.provider.getBlockNumber();
      return {
        status: 'ok',
        nodeUrl: this.configService.get<string>('STARKNET_RPC_URL'),
      };
    } catch (error) {
      return {
        status: 'error',
        nodeUrl: this.configService.get<string>('STARKNET_RPC_URL'),
        error: error.message,
      };
    }
  }
}
