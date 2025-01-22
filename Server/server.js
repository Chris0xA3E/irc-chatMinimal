const WebSocket = require('ws');
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, '../Client')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../Client/rooms.html'));
});

const clients = new Map(); 
const rooms = new Set(['general', 'gaming', 'music', 'tech','sports','politics']); // predefined rooms

wss.on('connection', (ws) => {
    let userInfo = {
        username: '',
        room: ''
    };

    ws.on('message', (message) => {
        const data = JSON.parse(message);

        switch (data.type) {
            case 'join':
                console.log('Join request received:', {
                    requestedRoom: data.room,
                    availableRooms: Array.from(rooms)
                });
                userInfo.username = data.username;
                userInfo.room = data.room;
                
                // Validate if room exists
                if (!rooms.has(data.room)) {
                    console.log('Room validation failed for:', data.room);
                    ws.send(JSON.stringify({
                        type: 'error',
                        content: 'Room does not exist'
                    }));
                    return;
                }

                clients.set(ws, userInfo);
                
                // Send room list to the new user
                ws.send(JSON.stringify({
                    type: 'roomList',
                    rooms: Array.from(rooms)
                }));

                // Broadcast join message to the specific room
                broadcastToRoom({
                    type: 'system',
                    content: `${userInfo.username} has joined the room`,
                    room: userInfo.room
                });
                break;

            case 'message':
                broadcastToRoom({
                    type: 'message',
                    username: userInfo.username,
                    content: data.content,
                    room: userInfo.room
                });
                break;

            case 'switchRoom':
                const oldRoom = userInfo.room;
                userInfo.room = data.room;
                clients.set(ws, userInfo);

                // Notify old room that user left
                broadcastToRoom({
                    type: 'system',
                    content: `${userInfo.username} has left the room`,
                    room: oldRoom
                });

                // Notify new room that user joined
                broadcastToRoom({
                    type: 'system',
                    content: `${userInfo.username} has joined the room`,
                    room: data.room
                });
                break;
        }
    });

    ws.on('close', () => {
        if (userInfo.username) {
            broadcastToRoom({
                type: 'system',
                content: `${userInfo.username} has left the room`,
                room: userInfo.room
            });
            clients.delete(ws);
        }
    });
});

function broadcastToRoom(message) {
    wss.clients.forEach((client) => {
        const clientInfo = clients.get(client);
        if (client.readyState === WebSocket.OPEN && clientInfo && clientInfo.room === message.room) {
            client.send(JSON.stringify(message));
        }
    });
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 