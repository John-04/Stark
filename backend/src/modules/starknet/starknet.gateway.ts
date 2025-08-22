import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { StarknetService } from './starknet.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class StarknetGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly starknetService: StarknetService) {}

  handleConnection(client: Socket, ...args: any[]) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('query')
  async handleQuery(client: Socket, payload: { query: string }): Promise<void> {
    try {
      const result = await this.starknetService.executeQuery(payload.query);
      this.server.to(client.id).emit('query_result', result);
    } catch (error) {
      this.server.to(client.id).emit('error', { message: error.message });
    }
  }
}
