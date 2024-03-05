var io = require('socket.io-client');

let socket = undefined;
let registered = false; 

export function registerSocket(onMessage, onSync) {
    if (registered) return false;
    
    socket = io.connect('http://localhost:3005');
    socket.on('connected', function(data) {
        console.log(`connected: ${data}`);
    });
    
    socket.on('broadcast', onMessage);
    socket.on('sync', onSync);
    registered = true;
    return true;
}

export function sendMessage(message) {
    socket.emit('message', message);
}

// socket.on('welcome', function(data) {
//     addMessage(data.message);

//     // Respond with a message including this clients' id sent from the server
//     socket.emit('i am client', {data: 'foo!', id: data.id});
// });
// socket.on('time', function(data) {
//     addMessage(data.time);
// });
// socket.on('error', console.error.bind(console));
// socket.on('message', console.log.bind(console));
