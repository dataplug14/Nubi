import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";
import { auth } from "express-oauth2-jwt-bearer";
import { parse } from 'url';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    noServer: true,
    clientTracking: true
  });

  const clients = new Map<WebSocket, Set<string>>();
  const jwtCheck = auth({
    audience: process.env.AUTH0_AUDIENCE,
    issuerBaseURL: process.env.AUTH0_DOMAIN,
    tokenSigningAlg: "RS256"
  });

  server.on('upgrade', async (request, socket, head) => {
    const { pathname, query } = parse(request.url || '', true);
    
    if (pathname !== '/ws') {
      socket.destroy();
      return;
    }

    try {
      // Get token from query parameter
      const token = query.token as string;
      if (!token) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
        socket.destroy();
        return;
      }

      // Add authorization header for JWT verification
      request.headers.authorization = `Bearer ${token}`;

      // Verify JWT token
      await new Promise((resolve, reject) => {
        jwtCheck(request as any, {} as any, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve(true);
          }
        });
      });

      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch (error) {
      console.error('WebSocket authentication error:', error);
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
    }
  });

  wss.on("connection", (ws) => {
    clients.set(ws, new Set());

    ws.on("message", (message) => {
      try {
        const { type, channel } = JSON.parse(message.toString());
        
        if (type === "subscribe") {
          const channels = clients.get(ws);
          channels?.add(channel);
        } else if (type === "unsubscribe") {
          const channels = clients.get(ws);
          channels?.delete(channel);
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", () => {
      clients.delete(ws);
    });

    // Send initial connection success message
    ws.send(JSON.stringify({ type: "connected" }));
  });

  return {
    broadcast: (channel: string, data: any) => {
      const message = JSON.stringify(data);
      clients.forEach((channels, client) => {
        if (channels.has(channel) && client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error("Broadcast error:", error);
          }
        }
      });
    }
  };
}
