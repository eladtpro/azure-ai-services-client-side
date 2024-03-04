import * as signalR from '@microsoft/signalr'


export function bindConnectionMessage(connection) {
    var messageCallback = function (name, message) {
        if (!message) return;
        // deal with the message
        alert("message received:" + message);
    };
    // Create a function that the hub can call to broadcast messages.
    connection.on('broadcastMessage', messageCallback);
    connection.on('echo', messageCallback);
}

var connection = new signalR.HubConnectionBuilder()
    .withUrl('/chat')
    .build();

bindConnectionMessage(connection);
connection.start()
    .then(function () {
        onConnected(connection);
    })
    .catch(function (error) {
        console.error(error.message);
    });