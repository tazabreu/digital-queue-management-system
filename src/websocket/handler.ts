import { WebSocket } from 'ws';
import { WebSocketMessage } from '../types';

class WebSocketHandler {
  private connections: Map<string, WebSocket> = new Map();

  // Handle new connection
  handleConnection(ws: WebSocket, id: string): void {
    this.connections.set(id, ws);

    ws.on('close', () => {
      this.connections.delete(id);
    });
  }

  // Broadcast message to all connected clients
  broadcast(message: WebSocketMessage): void {
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  }

  // Send message to specific client
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const ws = this.connections.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }
}

export const wsHandler = new WebSocketHandler(); 