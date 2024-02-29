require('dotenv').config();
const express = require('express');
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

app.get('/api/summarize', async (req, res, next) => {
// https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/quickstart?tabs=document-summarization%2Clinux&pivots=programming-language-javascript

const endpoint = process.env.LANGUAGE_ENDPOINT;
const apiKey = process.env.LANGUAGE_KEY;

const lang = req.query.lang;
const documents = [req.body];
  console.log("== Extractive Summarization Sample ==");

  const client = new TextAnalysisClient(endpoint, new AzureKeyCredential(apiKey));
  const actions = [
    {
      kind: "ExtractiveSummarization",
      maxSentenceCount: 2,
    },
  ];
  const poller = await client.beginAnalyzeBatch(actions, documents, lang);

  poller.onProgress(() => {
    console.log(
      `Last time the operation was updated was on: ${poller.getOperationState().modifiedOn}`
    );
  });
  console.log(`The operation was created on ${poller.getOperationState().createdOn}`);
  console.log(`The operation results will expire on ${poller.getOperationState().expiresOn}`);

  const results = await poller.pollUntilDone();

  for await (const actionResult of results) {
    if (actionResult.kind !== "ExtractiveSummarization") {
      throw new Error(`Expected extractive summarization results but got: ${actionResult.kind}`);
    }
    if (actionResult.error) {
      const { code, message } = actionResult.error;
      throw new Error(`Unexpected error (${code}): ${message}`);
    }
    for (const result of actionResult.results) {
      console.log(`- Document ${result.id}`);
      if (result.error) {
        const { code, message } = result.error;
        throw new Error(`Unexpected error (${code}): ${message}`);
      }
      console.log("Summary:");
      console.log(result.sentences.map((sentence) => sentence.text).join("\n"));
    }
  }
    res.send({ results: results });

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