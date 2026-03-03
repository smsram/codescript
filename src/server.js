process.env.TZ = 'Asia/Kolkata';

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');

// 1. Import the exam socket logic
const examSocket = require('./sockets/examSocket'); 

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize WebSockets
const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors({
    origin: '*', 
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.json({ status: "CodeScript Engine is Online", version: "1.0.0" });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/contests', require('./routes/contests'));
app.use('/api/problems', require('./routes/problems'));
app.use('/api/users', require('./routes/users'));
app.use('/api/dashboard', require('./routes/dashboard'));

// 2. PLUG IN THE EXAM SOCKET LOGIC HERE
// This connects the 'run-code' and 'join-exam' listeners to the io server
examSocket(io);

// Start the Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 CodeScript API & WebSockets running on port ${PORT}`);
    console.log(`📡 Socket.io listeners activated via examSocket.js`);
});