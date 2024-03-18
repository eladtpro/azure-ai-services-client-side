require('dotenv').config();
const cors = require("cors");
const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
// const io = require('socket.io')(http);
var io = require('socket.io')(http, { 'cors': { 'methods': ['GET', 'PATCH', 'POST', 'PUT'], 'origin': true /*accept from any domain */ } });

// require('./socket');
const entries = [];


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






app.use(
    cors({
        origin: [process.env.CORS_ALLOW_ORIGIN],
        credentials: true
    })
);

app.use(express.json()); // Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

const buildPath = path.normalize(path.join(__dirname, '../build'));
// const buildPath = path.join(__dirname, '../src/build');
app.use(express.static(buildPath));
const port = (process.env.NODE_ENV || 'development' === 'development') ? process.env.SERVER_PORT : process.env.PORT;
app.get('/api/config', (req, res) => {
    res.send({
        translateKey: process.env.TRANSLATE_KEY,
        translateRegion: process.env.TRANSLATE_REGION,
        translateEndpoint: process.env.TRANSLATE_ENDPOINT,
        speechKey: process.env.SPEECH_KEY,
        speechRegion: process.env.SPEECH_REGION,
        languageKey: process.env.LANGUAGE_KEY,
        languageRegion: process.env.LANGUAGE_REGION,
        languageEndpoint: process.env.LANGUAGE_ENDPOINT,
        socketEndpoint: process.env.SOCKET_ENDPOINT,
        port
    });
});

app.get('(/*)?', async (req, res, next) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(port, () =>
    console.log(`Express server is running on ${process.env.WEBSITE_HOSTNAME}  port: ${port}`)
);
