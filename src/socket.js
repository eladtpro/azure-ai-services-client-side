var io = require('socket.io-client');

let socket = undefined;
let registered = false; 

export function registerSocket(onMessage, onSync) {
    if (registered) return false;
    
    // socket = io.connect('http://localhost:3005');
    socket = io('http://localhost:3005');
    socket.on('connected', function(data) {
        console.log(data);
    });
    
    socket.on('broadcast', onMessage);
    socket.on('sync', onSync);
    registered = true;
    return true;
}

export function sendMessage(message) {
    socket.emit('message', message);
}
