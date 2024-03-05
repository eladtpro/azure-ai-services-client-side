import { Server } from "socket.io";
import { createServer } from "http";
const dotenv = require('dotenv');
const express = require('express');
const pino = require('express-pino-logger')();
const app = express();

// const httpServer = createServer(app);
// const io = new Server(httpServer, {
//   cors: {
//     origin: "http://localhost:3005"
//   }
// });

// const server = require('http').createServer(app);
// const io = require('socket.io')(server);

dotenv.config();
const entries = [];

app.use(express.json()); // Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
app.use(pino);

app.get('/api/config', (req, res) => {
    res.send({
        translateKey: process.env.TRANSLATE_KEY,
        translateRegion: process.env.TRANSLATE_REGION,
        translateEndpoint: process.env.TRANSLATE_ENDPOINT,
        speechKey: process.env.SPEECH_KEY,
        speechRegion: process.env.SPEECH_REGION,
        languageKey: process.env.LANGUAGE_KEY,
        languageRegion: process.env.LANGUAGE_REGION,
        languageEndpoint: process.env.LANGUAGE_ENDPOINT
    });
});

function broadcast(entry) {
    io.emit('broadcast', entry.toJSON());
}

function addEntry(entry) {
    entries.push(entry);
    entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
    broadcast(entry)
}

// Emit welcome message on connection
io.on('connection', function (socket) {
    // Use socket to communicate with this particular client only, sending it it's own id
    socket.emit('connected', { message: 'Welcome!', id: socket.id });

    socket.on('message', addEntry);
    socket.on('sync', () => 
        socket.emit('sync', entries.map(entry => entry.toJSON())));
    socket.on('disconnect', () => addEntry({ type: 'disconnect', timestamp: new Date().toISOString() }));
});

// server.listen(3005, () => {
//     console.log('Socket server is running on localhost:3005');
// });

app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);
