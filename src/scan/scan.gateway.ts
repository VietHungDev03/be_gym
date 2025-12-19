import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/scan',
  cors: {
    origin: '*',
  },
})
export class ScanGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    // eslint-disable-next-line no-console
    console.log('✅ Scan WS connected:', client.id);
  }

  handleDisconnect(client: any) {
    // eslint-disable-next-line no-console
    console.log('❌ Scan WS disconnected:', client.id);
  }

  @SubscribeMessage('scan')
  handleScan(@MessageBody() data: any) {
    const code = typeof data === 'string' ? data : data?.code;
    if (!code) {
      return;
    }
    this.server.emit('scan', { code, source: 'gateway' });
  }
}
