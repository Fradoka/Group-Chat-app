import WebSocket, { WebSocketServer } from 'ws'; // Import the WebSocket library

const wss = new WebSocketServer({ port: 3000 }); // Create a new WebSocket server on port 3000
console.log('WebSocket server is running on ws://localhost:3000');

const clients = new Set(); // each client is a ws connection
const messages = []; // store messages in memory { id, name, text, likes, dislikes }

wss.on('connection', (ws) => { // Listen for new connections
    console.log('New client connected');
    clients.add(ws); 

    ws.send(JSON.stringify({ type: 'all-messages', messages })); // Send existing messages to the new client

    ws.on('message', (data) => { // Listen for messages from clients
        console.log(`Received message: ${data}`);
        try {
            const msg = JSON.parse(data); // this should be { name, text }

            if (msg.type === 'new-message' && typeof msg.text === 'string' && msg.text.trim() !== '') {
                // Valid new message
                const message = {
                    id: Date.now(), // simple unique id based on timestamp
                    name: msg.name?.trim() || 'Anonymous',
                    text: msg.text,
                    likes: 0,
                    dislikes: 0
                };
                messages.push(message); // Store the new message

                // Broadcast the new message to all connected clients
                for (const client of clients) {
                    if (client.readyState === 1) { // WebSocket.OPEN to only send to open connections
                        client.send(JSON.stringify({ type: 'new-message', message }));
                    }
                } 
            }else if (msg.type === 'reaction'){
                // msg should have: {messageID, reaction: like or dislike}
                const message = messages.find(m => m.id === msg.messageID);
                if (!message) return; // message not found

                if (msg.reaction === 'like') { message.likes++ }
                else if (msg.reaction === 'dislike') { message.dislikes++ };

                // Broadcast the updated message to all connected clients
                for (const client of clients) {
                    if (client.readyState === 1) { // WebSocket.OPEN to only send to open connections
                        client.send(JSON.stringify({ type: 'update-message', message }));
                    }
                }
            }
        } catch (e) {
            console.error('Failed to process message:', e);
          }
    });

    ws.on('close', () => { // Listen for client disconnections
        console.log('Client disconnected');
        clients.delete(ws);
    });
});
