import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Grid, Stack, CssBaseline, Box, Paper, TextField, Typography, LinearProgress, Button } from '@mui/material';
import { Mic, Summarize } from '@mui/icons-material';
import { getTokenOrRefresh, translate, summarize } from './utils';
import { Language, Name, Summarization } from './components';
import getLPTheme from './getLPTheme';
// import image from '/VisionSpeechLanguageDecisionWebSearch_Diagram-02.png'

const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

let recognizer = null;

const styles = {
    paperContainer: {
        textAlign: 'right',
        paddingRight: '20px',
    }
};

const Item = styled(Paper)(({ theme }) => ({
    // backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
    ...theme.typography.body2,
    padding: theme.spacing(1),
    textAlign: 'left',
    color: theme.palette.text.secondary,
}));

export default function App() {
    const LPtheme = createTheme(getLPTheme('dark'));
    const [entries, setEntries] = useState([]);
    const [conversation, setConversation] = useState('');
    const [translation, setTranslation] = useState('');
    const [summarization, setSummarization] = useState(undefined);
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
            .then((result) => {
                setSummarization(result);
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
                <Grid container spacing={4}>
                    <Grid item xs={12}>&nbsp;</Grid>
                    <Grid item xs={4}>
                        <Typography variant="h3" component="div" gutterBottom paddingLeft={4}>
                            Speech & Translate
                        </Typography>
                    </Grid>
                    <Grid item xs={8}>
                        <Paper style={styles.paperContainer}>
                            <img src="/VisionSpeechLanguageDecisionWebSearch_Diagram-02.png" height={100} alt="Speech & Translate" />
                        </Paper>
                    </Grid>                
                    <Grid item xs={12}>
                        <Grid container spacing={2}>
                            <Grid item xs={2}>
                                <Stack spacing={4} direction="column" maxWidth={200}>
                                    <Item>
                                        <Name value={name} lalbel="Name" onChange={setName} fullWidth />
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
                                        <Button variant="outlined" size="medium" fullWidth endIcon={<Mic />} onClick={sttFromMic} disabled={!name} >
                                            Listen
                                        </Button>
                                    </Item>
                                    <Item>
                                        <Button variant="outlined" size="medium" fullWidth endIcon={<Summarize />} onClick={handleClick} disabled={!translation} >
                                            Summarize
                                        </Button>
                                    </Item>
                                </Stack>
                            </Grid>
                            <Grid item xs={10}>
                                <Grid container spacing={2}>
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
                                        {translating ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />}
                                        <TextField
                                            id="outlined-multiline-static"
                                            label="Translation"
                                            multiline
                                            rows={20}
                                            value={translation}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={5}>
                                        {recognizing ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />}
                                        <TextField
                                            id="outlined-multiline-static"
                                            label="Listening..."
                                            multiline
                                            rows={2}
                                            value={recognizingText}
                                            fullWidth
                                        />
                                    </Grid>
                                    <Grid item xs={7}>
                                        {summarization && (summarizing ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />)}
                                        {summarization && <Summarization result={summarization} />}
                                    </Grid>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </ThemeProvider>
    );
}