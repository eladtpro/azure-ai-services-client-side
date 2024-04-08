module.exports = function (app) {
    const http = require('http').Server(app);
    const io = require('socket.io')(http);
    // const { Server } = require("socket.io");
    const { useAzureSocketIO } = require("@azure/web-pubsub-socket.io");

    // let io = new Server(process.env.SOCKET_PORT);
    let entries = [];

    function validateEntry(entry) {
        const requiredProperties = ['type', 'timestamp', 'id'];
        return entry && requiredProperties.every(prop => entry.hasOwnProperty(prop));
    }

    // Use the following line to integrate with Web PubSub for Socket.IO
    useAzureSocketIO(io, {
        hub: "Hub", // The hub name can be any valid string.
        connectionString: process.env.SOCKET_CONNECTION_STRING
    });

    function broadcast(entry) {
        io.emit('broadcast', entry);
    }

    function addEntry(entry) {
        if (!validateEntry(entry)) return;
        if (entries.findIndex((e) => e.id === entry.id) !== -1) return;
        console.log(entry);
        entries.push(entry);
        entries.sort((a, b) => b.id.localeCompare(a.id));
        broadcast(entry)
    }

    // Emit welcome message on connection
    io.on('connection', function (socket) {
        // Use socket to communicate with this particular client only, sending it it's own id
        socket.emit('connected', { message: `Socket connected with id:  ${socket.id}`, entries });

        socket.on('message', addEntry);
        socket.on('sync', () =>
            socket.emit('sync', entries));
        socket.on('clear', () => {
            entries = [];
            io.emit('sync', entries);
        });
        socket.on('disconnect', () => addEntry({ type: 'disconnect', timestamp: new Date().toISOString() }));
    });

    io.httpServer.listen(process.env.SOCKET_PORT, () => {
        console.log('Visit http://localhost:%d', process.env.SOCKET_PORT);
    });
};

