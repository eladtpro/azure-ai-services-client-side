require('dotenv').config();
const cors = require("cors");
// var io = require('socket.io');
const express = require('express');
// const axios = require('axios');
const pino = require('express-pino-logger')();
const app = express();
// const server = require('http').createServer(app);

app.use(
    cors({
      origin: ["http://localhost:3000", "http://localhost:3005"],
      credentials: true
    })
  );

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

// app.get('/api/get-speech-token', async (req, res, next) => {
//     res.setHeader('Content-Type', 'application/json');
//     const speechKey = process.env.SPEECH_KEY;
//     const speechRegion = process.env.SPEECH_REGION;

//     if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
//         res.status(400).send('You forgot to add your speech key or region to the .env file.');
//     } else {
//         const headers = {
//             headers: {
//                 'Ocp-Apim-Subscription-Key': config.speechKey,
//                 'Content-Type': 'application/x-www-form-urlencoded'
//             }
//         };

//         try {
//             const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
//             res.send({ token: tokenResponse.data, region: speechRegion });
//         } catch (err) {
//             res.status(401).send('There was an error authorizing your speech key.');
//         }
//     }
// });

// io.listen(3005)

// // Send current time to all connected clients
// function broadcast(entry) {
//     io.emit('broadcast', entry.toJSON());
// }

// function addEntry(entry) {
//     entries.push(entry);
//     entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
//     broadcast(entry)
// }


// // Emit welcome message on connection
// io.on('connection', function (socket) {
//     // Use socket to communicate with this particular client only, sending it it's own id
//     socket.emit('connected', { message: 'Welcome!', id: socket.id });

//     socket.on('message', addEntry);
//     socket.on('sync', () => 
//         socket.emit('sync', entries.map(entry => entry.toJSON())));
//     socket.on('disconnect', () => addEntry({ type: 'disconnect', timestamp: new Date().toISOString() }));
// });


app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);
