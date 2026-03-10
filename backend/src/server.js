process.env.TZ = 'Asia/Kolkata';

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

const examSocket = require('./sockets/examSocket'); 

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// 🚀 FIX: Use ONLY the 10mb limit version. Do not call app.use(express.json()) twice!
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Routes
app.get('/', (req, res) => {
    res.json({ status: "CodeScript Engine is Online", version: "1.0.0" });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/admin', require('./routes/admin'));

// WebSocket
examSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 CodeScript API & WebSockets running on port ${PORT}`);
});