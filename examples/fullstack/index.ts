import { createFullstackServer } from '../../src/core/fullstack-server';
import { join } from 'path';
import type { ServerWebSocket } from 'bun';

// Keep track of all connected WebSocket clients
const clients = new Set<ServerWebSocket>();

// Message history for new connections
const messageHistory: { user: string, message: string, timestamp: string }[] = [];
const MAX_HISTORY = 50; // Maximum number of messages to keep in history

// Handle WebSocket connections and messages
function handleWebSocket(ws: ServerWebSocket, message?: string | Uint8Array) {
  // If this is a new connection
  if (!message) {
    console.log('WebSocket connected');
    
    // Add the client to our set
    clients.add(ws);
    
    // Send message history to new client
    if (messageHistory.length > 0) {
      ws.send(JSON.stringify({
        type: 'history',
        messages: messageHistory
      }));
    }
    
    // Add close event handler (Bun WebSockets don't have onclose property)
    // Instead, we'll just monitor the clients in the message handler
    
    return;
  }
  
  // Handle incoming message
  try {
    const data = JSON.parse(message as string);
    
    if (data.type === 'chat') {
      const messageData = {
        user: data.user || 'Anonymous',
        message: data.message,
        timestamp: new Date().toISOString()
      };
      
      // Add to history
      messageHistory.push(messageData);
      
      // Limit history size
      if (messageHistory.length > MAX_HISTORY) {
        messageHistory.shift();
      }
      
      // Broadcast to all clients
      const outgoingMessage = JSON.stringify({
        type: 'message',
        data: messageData
      });
      
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(outgoingMessage);
        }
      }
    }
  } catch (error) {
    console.error('Error processing WebSocket message:', error);
  }
}

// Start the fullstack server
const server = createFullstackServer({
  htmlDir: join(__dirname, 'html'),
  apiDir: join(__dirname, 'api'),
  publicDir: join(__dirname, 'public'),
  port: 3001,
  hostname: 'localhost',
  development: true,
  routes: [{
    pattern: '/hello/:name',
    handler: (req, match) => {
      const name = match?.[1] || 'World';
      return new Response(`Hello, ${name}!`);
    }
  }],
  websocketHandler: handleWebSocket
});

console.log(`Server running at http://localhost:3001`);
console.log(`WebSocket server available at ws://localhost:3001/ws`); 