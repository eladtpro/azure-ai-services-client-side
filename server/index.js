require('dotenv').config();
const cors = require("cors");
const express = require('express');
const path = require('path');
const app = express();

require('./socket');

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
        socketPort: process.env.SOCKET_PORT,
        port: process.env.PORT
    });
});

app.get('(/*)?', async (req, res, next) => {
    res.sendFile(path.join(buildPath, 'index.html'));
});

app.listen(process.env.PORT, () =>
    console.log(`Express server is running on ${process.env.WEBSITE_HOSTNAME}  port: ${process.env.PORT}`)
);
