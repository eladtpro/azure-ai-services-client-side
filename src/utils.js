import axios from 'axios';
import Cookie from 'universal-cookie';
const { v4: uuidv4 } = require('uuid');

let configCache = undefined;

export function buildMessage(name, text, language, role = 'Agent') {
    const date = new Date();
    return { id: toFiletime(date), timestamp: date.toLocaleTimeString(language), name, text, role, language, participantId: name.replace(' ', '_') };
}

function toFiletime(date) {
    return date.getTime() * 1e4 + 116444736e9;
}

async function getConfig() {
    if (configCache == undefined) {
        const response = await axios.get('/api/config');
        configCache = response.data;
    }
    return configCache;
}

export async function getSpeechToken() {
    const cookie = new Cookie();
    const speechToken = cookie.get('speech-token');

    if (speechToken === undefined) {
        const config = await getConfig();
        const headers = {
            headers: {
                'Ocp-Apim-Subscription-Key': configCache.speechKey,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        const response = await axios.post(`https://${config.speechRegion}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, null, headers);
        return { token: response.data, region: config.speechRegion };
    } else {
        console.log('Token fetched from cookie: ' + speechToken);
        const idx = speechToken.indexOf(':');
        return { authToken: speechToken.slice(idx + 1), region: speechToken.slice(0, idx) };
    }
}

export async function translate(text, from, to) {
    try {
        const config = await getConfig();
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
        const config = await getConfig();
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
        // const sumRes = await axios.post('/api/summarize', data);
        // return sumRes.data;

        const headers = {
            headers: {
                'Ocp-Apim-Subscription-Key': config.languageKey,
                'Content-type': 'application/json',
                // 'X-ClientTraceId': uuidv4().toString()
            }
        };

        let res = await axios.post(`${config.languageEndpoint}language/analyze-conversations/jobs?api-version=2023-11-15-preview`, data, headers);
        const jobId = res.headers['operation-location'];

        let completed = false
        while (!completed) {
            res = await axios.get(`${jobId}`, headers);
            completed = res.data.tasks.completed > 0;
        }

        return res.data;
    } catch (err) {
        console.log(err.message);
        return `Error summarizing text. ${err.message}`;
    }
}
