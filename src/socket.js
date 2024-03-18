var io = require('socket.io-client');

let socket = undefined;
let registered = false; 

export function registerSocket(endpoint, onMessage, onSync) {
    if (registered) return false;

    // const endpoint = `${window.location.protocol}//${window.location.hostname}:${port}`;
    console.log('Connecting to ' + endpoint);
    socket = io(endpoint);
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
