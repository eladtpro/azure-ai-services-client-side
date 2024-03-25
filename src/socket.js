var io = require('socket.io-client');

export let sendMessage = undefined;
export let syncMessages = undefined;
export let clearMessages = undefined;

export function registerSocket(endpoint, onMessage, onSync) {
    if (sendMessage) return false;

    // const endpoint = `${window.location.protocol}//${window.location.hostname}:${port}`;
    console.log('Connecting to ' + endpoint);
    const socket = io(endpoint, {
        path: "/clients/socketio/hubs/Hub",
    });

    socket.on('connected', function (data) {
        console.log('Socket connected to server')
        console.log(data);
        onSync(data.entries);
    });

    socket.on('broadcast', onMessage);
    socket.on('sync', onSync);

    sendMessage = (message) =>
        socket.emit('message', message);
    syncMessages = () =>
        socket.emit('sync');
    clearMessages = () =>
        socket.emit('clear');
}
