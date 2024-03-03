require('dotenv').config();
const express = require('express');
const axios = require('axios');
const pino = require('express-pino-logger')();
const app = express();
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

app.get('/api/get-speech-token', async (req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    const speechKey = process.env.SPEECH_KEY;
    const speechRegion = process.env.SPEECH_REGION;

    if (speechKey === 'paste-your-speech-key-here' || speechRegion === 'paste-your-speech-region-here') {
        res.status(400).send('You forgot to add your speech key or region to the .env file.');
    } else {
        const headers = { 
            headers: {
                'Ocp-Apim-Subscription-Key': speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };

        try {
            const tokenResponse = await axios.post(`https://${speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
            res.send({ token: tokenResponse.data, region: speechRegion });
        } catch (err) {
            res.status(401).send('There was an error authorizing your speech key.');
        }
    }
});

app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);
