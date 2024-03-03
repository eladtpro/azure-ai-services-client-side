require('dotenv').config();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const pino = require('express-pino-logger')();
const { AzureKeyCredential, TextAnalysisClient } = require("@azure/ai-language-text");
// const { translate } = require('../src/utils');
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

app.post('/api/summarize', async (req, res, next) => {
// https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/quickstart?tabs=document-summarization%2Clinux&pivots=programming-language-javascript

const endpoint = process.env.LANGUAGE_ENDPOINT;
const apiKey = process.env.LANGUAGE_KEY;
    // https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization
    try {
      // const conversation = {
      //     displayName: 'Conversation Summarization',
      //     analysisInput: {
      //         conversations: [{
      //             conversationItems: entries,
      //             language: language,
      //             modality: "text",
      //             id: "conversation1"
      //         }],

      //     },
      //     tasks: [
      //         {
      //             taskName: "Conversation Task 1",
      //             kind: "ConversationalSummarizationTask",
      //             parameters: {
      //                 summaryAspects: [
      //                     "recap",
      //                     "follow-up tasks"
      //                 ]
      //             }
      //         }
      //     ]
      // };
      // let data = JSON.stringify(conversation);
      const data = req.body;
      const headers = {
          headers: {
              'Ocp-Apim-Subscription-Key': apiKey,
              'Content-type': 'application/json',
              'X-ClientTraceId': uuidv4().toString()
          }
      };

      let res = await axios.post(`https://${endpoint}language/analyze-conversations/jobs?api-version=2023-11-15-preview`, data, headers);
      const jobId = res.headers['operation-location'];

      res = await axios.get(`https://${endpoint}language/analyze-conversations/jobs/${jobId}?api-version=2023-11-15-preview`, headers);
      return res.data.tasks;
  } catch (err) {
      console.log(err.message);
      return `Error summarizing text. ${err.message}`;
  }

});


app.listen(3001, () =>
    console.log('Express server is running on localhost:3001')
);















// app.post('/api/translate2', async (req, res, next) => {
//     console.log('POST /api/translate');
//     res.setHeader('Content-Type', 'application/json');
//     res.send({ translation: 'Hello, friend! What did you do today?', region: 'eastus' });
// });

// app.post('/api/translate', async (req, res, next) => {
//     console.log('POST /api/translate');
//     // https://learn.microsoft.com/en-us/azure/ai-services/translator/translator-text-apis?tabs=nodejs
//     let key = process.env.TRANSLATE_KEY;
//     let endpoint = process.env.TRANSLATE_ENDPOINT;
    
//     // location, also known as region.
//     // required if you're using a multi-service or regional (not global) resource. It can be found in the Azure portal on the Keys and Endpoint page.
//     let location = process.env.TRANSLATE_REGION;
    
//     const from = req.query.from;
//     const to = req.query.to;
//     const data = req.body;

//     // let params = new URLSearchParams();
//     // params.append("api-version", "3.0");
//     // params.append("from", from);
//     // params.append("to", to);
//     // // params.append("from", "en");
//     // // params.append("to", "sw");
//     // // params.append("to", "it");
    
//     const headers = { 
//         headers: {
//             'Ocp-Apim-Subscription-Key': key,
//              // location required if you're using a multi-service or regional (not global) resource.
//             'Ocp-Apim-Subscription-Region': location,
//             'Content-type': 'application/json',
//             'X-ClientTraceId': uuidv4().toString()
//         }
//     };
    
//     try {
//         const translateResponse = await axios.post(`${endpoint}translate?api-version=3.0&from=${from}&to=${to}`, data, headers);
//         res.send({ translation: translateResponse.data, region: location });
//     } catch (err) {
//         res.status(500).send(err.message + 'AAAA');
//     }



// //     // axios({
// //     //     baseURL: endpoint,
// //     //     url: '/translate',
// //     //     method: 'post',
// //     //     headers: {
// //     //         'Ocp-Apim-Subscription-Key': key,
// //     //          // location required if you're using a multi-service or regional (not global) resource.
// //     //         'Ocp-Apim-Subscription-Region': location,
// //     //         'Content-type': 'application/json',
// //     //         'X-ClientTraceId': uuidv4().toString()
// //     //     },
// //     //     params: params,
// //     //     data: [{
// //     //         'text': 'Hello, friend! What did you do today?'
// //     //     }],
// //     //     responseType: 'json'
// //     // }).then(function(response){
// //     //     console.log(JSON.stringify(response.data, null, 4));
// //     // })


// });