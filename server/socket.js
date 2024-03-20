require('dotenv').config();
const { Server } = require("socket.io");
const { useAzureSocketIO } = require("@azure/web-pubsub-socket.io");

let io = new Server(process.env.SOCKET_PORT);

// Use the following line to integrate with Web PubSub for Socket.IO
useAzureSocketIO(io, {
    hub: "Hub", // The hub name can be any valid string.
    connectionString: process.env.SOCKET_CONNECTION_STRING
});

function broadcast(entry) {
    io.emit('broadcast', entry);
}

function addEntry(entry) {
    if(entry.id === undefined) return;
    if(entries.findIndex((e) => e.id === entry.id) !== -1) return;
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

