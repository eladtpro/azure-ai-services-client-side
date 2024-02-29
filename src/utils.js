import axios from 'axios';
import Cookie from 'universal-cookie';
const { v4: uuidv4 } = require('uuid');

export async function getTokenOrRefresh() {
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');

    if (speechToken === undefined) {
        try {
            const res = await axios.get('/api/get-speech-token');
            const token = res.data.token;
            const region = res.data.region;
            cookie.set('speech-token', region + ':' + token, { maxAge: 540, path: '/' });

            console.log('Token fetched from back-end: ' + token);
            return { authToken: token, region: region };
        } catch (err) {
            console.log(err.response.data);
            return { authToken: null, error: err.response.data };
        }
    } else {
        console.log('Token fetched from cookie: ' + speechToken);
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
    }
}

export async function translate(text, from, to) {
    try {
        const response = await axios.get('/api/config');
        const config = response.data;
        const data = [{ text }];
        const headers = {
            headers: {
                'Ocp-Apim-Subscription-Key': config.translateKey,
                // location required if you're using a multi-service or regional (not global) resource.
                'Ocp-Apim-Subscription-Region': config.translateRegion,
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            }
        };

        const res = await axios.post(`${config.translateEndpoint}translate?api-version=3.0&from=${from}&to=${to}`, data, headers);
        return res.data[0].translations[0].text;
    } catch (err) {
        console.log(err.response.data);
        return 'Error translating text.';
    }
}

export async function summarize(entries, language) {
    // https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization
    try {
        const response = await axios.get('/api/config');
        const config = response.data;
        const conversation = {
            displayName: 'Conversation Summarization',
            analysisInput: {
                conversations: [{
                    conversationItems: entries,
                    language: language,
                    modality: "text",
                    id: "conversation1"
                }],

            },
            tasks: [
                {
                    taskName: "Conversation Task 1",
                    kind: "ConversationalSummarizationTask",
                    parameters: {
                        summaryAspects: [
                            "recap",
                            "follow-up tasks"
                        ]
                    }
                }
            ]
        };
        let data = JSON.stringify(conversation);

        const headers = {
            headers: {
                'Ocp-Apim-Subscription-Key': config.languageKey,
                'Content-type': 'application/json',
                'X-ClientTraceId': uuidv4().toString()
            }
        };

        let res = await axios.post(`https://${config.languageEndpoint}language/analyze-conversations/jobs?api-version=2023-11-15-preview`, data, headers);
        const jobId = res.headers['operation-location'];

        res = await axios.get(`https://${config.languageEndpoint}language/analyze-conversations/jobs/${jobId}?api-version=2023-11-15-preview`, headers);
        return res.data.tasks;
    } catch (err) {
        console.log(err.message);
        return `Error summarizing text. ${err.message}`;
    }
}
