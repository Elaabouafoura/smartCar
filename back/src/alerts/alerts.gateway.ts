import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { VehicleNotification } from './types/vehicle-notification.type'

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class AlertsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  handleConnection(client: Socket) {
    const userId = client.handshake.auth?.userId as string | undefined

    if (userId) {
      client.join(`user:${userId}`)
    }
  }

  handleDisconnect(client: Socket) {
    client.disconnect()
  }

  emitToUser(userId: string, notification: VehicleNotification) {
    this.server.to(`user:${userId}`).emit('notification:new', notification)
  }

  emitManyToUser(userId: string, notifications: VehicleNotification[]) {
    this.server.to(`user:${userId}`).emit('notification:batch', notifications)
  }
}