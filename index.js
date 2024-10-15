const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.get('/', (req, res) => res.send('Real-Time Collaboration Platform'));

io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('codeChange', (code) => {
        socket.broadcast.emit('codeUpdate', code);
    });

    socket.on('signal', (data) => {
        // Forward the signaling data to the other peer
        socket.broadcast.emit('signal', data);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnect');
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log('Server running on Port ${PORT}'));