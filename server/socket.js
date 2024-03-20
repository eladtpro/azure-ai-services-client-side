require('dotenv').config();
// const { Server } = require("socket.io");
const entries = [];

module.exports = function(http) {
    if(process.env.ENABLE_SOCKET_SERVER == "0") {
        console.log('Socket server is disabled');
        return;
    }

    const io = require('socket.io')(http, { 
        cors: { 'methods': ['GET', 'PATCH', 'POST', 'PUT'], 'origin': true /* accept from any domain */ },
        perMessageDeflate: false
    });
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

    http.listen(process.env.SOCKET_PORT, function(){
        console.log('Express server listening on port ' + process.env.SOCKET_PORT);
    });
};




