require('dotenv').config();
const { Server } = require("socket.io");

const entries = [];

console.log('Socket env: ' + process.env);
console.log('Socket listening to: ' + process.env.SOCKET_PORT);
const io = new Server(process.env.SOCKET_PORT, {
    cors: {
        origin: process.env.CORS_ALLOW_ORIGIN
    }
});

// Send current time to all connected clients
function broadcast(entry) {
    io.emit('broadcast', entry);
}

function addEntry(entry) {
    console.log(entry);
    entries.push(entry);
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    broadcast(entry)
}

// Emit welcome message on connection
io.on('connection', function (socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('connected', { message: `Socket connected with id:  ${socket.id}` });

    socket.on('message', addEntry);
    socket.on('sync', () =>
        socket.emit('sync', entries.map(entry => entry.toJSON())));
    socket.on('disconnect', () => addEntry({ type: 'disconnect', timestamp: new Date().toISOString() }));
});
