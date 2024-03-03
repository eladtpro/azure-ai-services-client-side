import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Grid, IconButton, Stack, CssBaseline, Box, Paper, TextField, Typography, LinearProgress, Button } from '@mui/material';
import { Mic, MicNone, Send, Summarize } from '@mui/icons-material';
import { getTokenOrRefresh, translate, summarize } from './utils';
import { Language, Name } from './components';
import getLPTheme from './getLPTheme';

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

let recognizer = null;

const Item = styled(Paper)(({ theme }) => ({
    // backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'center',
    color: theme.palette.text.secondary,
}));

export default function App() {
    const [mode, setMode] = React.useState('dark');
    const LPtheme = createTheme(getLPTheme(mode));
    const [entries, setEntries] = useState([]);
    const [conversation, setConversation] = useState('');
    const [translation, setTranslation] = useState('');
    const [summarization, setSummarization] = useState('');
    const [recognizedText, setRecognizedText] = useState('');
    const [recognizingText, setRecognizingText] = useState('');
    const [language, setLanguage] = useState('he-IL');
    const [translateLanguage, setTranslateLanguage] = useState('en-US');
    const [recognizing, setRecognizing] = useState(false);
    const [translating, setTranslating] = useState(false);
    const [summarizing, setSummarizing] = useState(false);
    const [name, setName] = useState('');

    useEffect(() => {
        let conv = '', trans = '';
        for (const entry of entries) {
            conv += `[${entry.timestamp}] ${entry.name}:    ${entry.text}.\n`;
            trans += `[${entry.timestamp}] ${entry.name}:    ${entry.translation || '...'}.\n`;
        }

        setConversation(conv);
        setTranslation(trans);
    }, [entries]);

    useEffect(() => {
        // translate last entry
        if (entries.length === 0) return;
        const lastIndex = entries.length - 1;
        const lastEntry = entries[lastIndex];
        if (lastEntry.translation) return;
        setTranslating(true);
        translate(lastEntry.text, language, translateLanguage)
            .then((trans) => {
                const copy = [...entries];
                copy[lastIndex].translation = trans;
                setEntries(copy);
            })
            .finally(() => setTranslating(false));
    }, [entries]);

    useEffect(() => {
        if (!recognizedText) return;
        const entry = { id: entries.length, timestamp: new Date().toLocaleTimeString(language), name, text: recognizedText, role: 'Agent', participantId: name.replace(' ', '_') };
        setEntries([...entries, entry])
        setRecognizingText('');
        setRecognizing(false);
    }, [recognizedText]);

    useEffect(() => {
        if (!recognizingText) return;
        setRecognizing(true);
    }, [recognizingText]);

    function logText(newText) {
        console.log(newText);
    }

    function handleClick() {
        setSummarizing(true);
        summarize(entries, language)
            .then((summary) => {
                setSummarization(summary);
            })
            .finally(() => setSummarizing(false));
    }

    async function sttFromMic() {
        const tokenObj = await getTokenOrRefresh();
        const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.authToken, tokenObj.region);
        speechConfig.speechRecognitionLanguage = language;

        const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
        recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

        recognizer.recognizing = (s, e) => {
            setRecognizingText(e.result.text);
        };

        recognizer.recognized = (s, e) => {
            if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech) {
                setRecognizedText(e.result.text);
            }
            else if (e.result.reason === speechsdk.ResultReason.NoMatch) {
                logText("NOMATCH: Speech could not be recognized.");
            }
        };

        recognizer.canceled = (s, e) => {
            logText(`CANCELED: Reason=${e.reason}`);

            if (e.reason === speechsdk.CancellationReason.Error) {
                logText(`"CANCELED: ErrorCode=${e.errorCode}`);
                logText(`"CANCELED: ErrorDetails=${e.errorDetails}`);
                logText("CANCELED: Did you set the speech resource key and region values?");
            }

            recognizer.stopContinuousRecognitionAsync();
        };

        recognizer.sessionStopped = (s, e) => {
            logText("\n    Session stopped event.");
            recognizer.stopContinuousRecognitionAsync();
        };

        logText('speak into your microphone...');

        recognizer.startContinuousRecognitionAsync();
    }

    return (
        <ThemeProvider theme={LPtheme}>
            <CssBaseline />
            <Box sx={{ bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <Typography variant="h3" component="div" gutterBottom>
                            Speech & Translate
                        </Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Stack spacing={2} direction="row">
                            <Item>
                                <Name value={name} lalbel="Name" onChange={setName} />
                            </Item>
                            <Item>
                                <Language
                                    lalbel="Spoken language"
                                    value={language}
                                    onChange={setLanguage}
                                />
                            </Item>
                            <Item>
                                <Language
                                    lalbel="Translated language"
                                    value={translateLanguage}
                                    onChange={setTranslateLanguage}
                                />
                            </Item>
                            <Item>
                                {name ?
                                    <IconButton aria-label="sttMic" onClick={sttFromMic}>
                                        <Mic />
                                    </IconButton> : <MicNone />
                                }
                            </Item>
                            <Button variant="contained" endIcon={<Summarize />} onClick={handleClick}>
                            Summarize
                            </Button>

                        </Stack>
                    </Grid>
                    <Grid item xs={12}>
                        {recognizing ? <LinearProgress /> : ''}
                        <TextField
                            id="outlined-multiline-static"
                            label="Listening..."
                            multiline
                            rows={2}
                            value={recognizingText}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            id="outlined-multiline-static"
                            label="Conversation"
                            multiline
                            rows={20}
                            value={conversation}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={6}>
                        {translating ? <LinearProgress /> : ''}
                        <TextField
                            id="outlined-multiline-static"
                            label="Translation"
                            multiline
                            rows={20}
                            value={translation}
                            fullWidth
                        />
                    </Grid>
                    <Grid item xs={12}>
                        {summarizing ? <LinearProgress /> : ''}
                        <TextField
                            id="outlined-multiline-static"
                            label="Summarization"
                            multiline
                            rows={2}
                            value={summarization}
                            fullWidth
                        />
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    );
}