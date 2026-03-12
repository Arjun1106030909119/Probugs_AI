const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Route Files
const auth = require('./routes/authRoutes');
const tickets = require('./routes/ticketRoutes');
const analytics = require('./routes/analyticsRoutes');
const slaService = require('./services/slaService');

// Middleware
app.use(cors({
    origin: "*",
    allowedHeaders: ['Content-Type', 'Authorization', 'x-extension-source']
}));
app.use(express.json());
app.use(morgan('dev'));

// Mount Routers
app.use('/api/auth', auth);
app.use('/api/tickets', tickets);
app.use('/api/analytics', analytics);

// Basic Route
app.get('/', (req, res) => {
    res.send('AI Ticket Management System API is running...');
});

app.get('/api/debug-headers', (req, res) => {
    res.json({
        headers: req.headers,
        extensionSource: req.headers['x-extension-source']
    });
});

// Database Connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/probugs';

const http = require('http');
const { Server } = require('socket.io');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('socketio', io);

// Helper to broadcast system telemetry
const broadcastLog = (type, msg) => {
    io.emit('system_log', {
        id: Date.now(),
        time: new Date().toLocaleTimeString(),
        type,
        msg
    });
};

const ticketViewers = {};

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);
    broadcastLog('info', `Socket connection established: ${socket.id.slice(0, 8)}...`);

    socket.on('join_ticket', ({ ticketId, user }) => {
        socket.join(ticketId);
        if (!ticketViewers[ticketId]) ticketViewers[ticketId] = [];
        if (!ticketViewers[ticketId].find(v => v.id === user.id)) {
            ticketViewers[ticketId].push({ ...user, socketId: socket.id });
        }
        io.to(ticketId).emit('viewers_updated', ticketViewers[ticketId]);
        broadcastLog('success', `Presence Broadcast: ${user.name} joined #${ticketId}`);
        console.log(`User ${user.name} joined ticket ${ticketId}`);
    });

    socket.on('leave_ticket', ({ ticketId, user }) => {
        socket.leave(ticketId);
        if (ticketViewers[ticketId]) {
            ticketViewers[ticketId] = ticketViewers[ticketId].filter(v => v.id !== user.id);
            io.to(ticketId).emit('viewers_updated', ticketViewers[ticketId]);
        }
    });

    socket.on('typing', ({ ticketId, user }) => {
        socket.to(ticketId).emit('user_typing', { user });
        broadcastLog('zap', `Neural activity: ${user.name} is composing on #${ticketId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected');
        broadcastLog('warning', `Socket disconnected: ${socket.id.slice(0, 8)}...`);
        // Clean up viewers across all tickets
        Object.keys(ticketViewers).forEach(ticketId => {
            const hasUser = ticketViewers[ticketId].some(v => v.socketId === socket.id);
            if (hasUser) {
                ticketViewers[ticketId] = ticketViewers[ticketId].filter(v => v.socketId !== socket.id);
                io.to(ticketId).emit('viewers_updated', ticketViewers[ticketId]);
            }
        });
    });
});

// SLA Monitor (Runs every 10 minutes)
setInterval(() => {
    if (io) {
        slaService.checkSLAs(io);
    }
}, 10 * 60 * 1000);

console.log('Using MONGODB_URI:', MONGODB_URI.replace(/\/\/.*@/, '//****@'));

const connectDB = async () => {
    try {
        console.log('Attempting to connect to MongoDB...');
        await mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 5000
        });
        console.log('✅ Connected to MongoDB successfully!');

        server.listen(PORT, '0.0.0.0', () => {
            console.log(`🚀 Server listening at http://localhost:${PORT}`);
            console.log('Real-time sync enabled via Socket.io');
        });
    } catch (err) {
        console.error('❌ CRITICAL: MongoDB connection failed!');
        console.error('Error:', err.message);
        console.log('Retrying in 5 seconds...');
        setTimeout(connectDB, 5000);
    }
};

connectDB();
