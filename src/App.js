import React, { useEffect, useState } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import { Grid, Stack, CssBaseline, Box, Paper, TextField, Typography, LinearProgress, Button } from '@mui/material';
import { Mic, MicNone, Summarize } from '@mui/icons-material';
import { translate, summarize, buildMessage, Status, getConfig } from './utils';
import { Language, Name, Summarization, Chat } from './components';
import getLPTheme from './getLPTheme';
import { startSttFromMic, stopSttFromMic } from './stt';
import { registerSocket, sendMessage } from './socket';

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
    const [status, setStatus] = useState(Status.IDLE);
    // const [conversation, setConversation] = useState('');
    // const [translation, setTranslation] = useState('');
    const [summarization, setSummarization] = useState(undefined);
    const [recognizedText, setRecognizedText] = useState('');
    const [recognizingText, setRecognizingText] = useState('');
    const [language, setLanguage] = useState('he-IL');
    const [translateLanguage, setTranslateLanguage] = useState('en-US');
    const [name, setName] = useState('');
    const [config, setConfig] = useState(undefined);
    const [socketEntry, setSocketEntry] = useState(undefined);


    useEffect(() => {
        if(!socketEntry) return;
        if(!name) return;
        if(!entries) return;
        if(!setEntries) return;
        if (socketEntry.name === name) return;
        if (socketEntry.type !== 'message') return;
        const copy = [...entries, socketEntry];
        copy.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
        setEntries(copy);
    }, [socketEntry, name, entries, setEntries]);


    useEffect(() => {
        const fetchConfig = async () => {
            const conf = await getConfig();
            setConfig(conf);
        }

        fetchConfig();
    }, [setConfig]);

    useEffect(() => {
        if (!config) return;

        const onMessage = (entry) => {
            setSocketEntry(entry);
        }
        const onSync = (entries) => {
            console.log(entries);
            setEntries(entries);
        }
        registerSocket(config.socketPort, onMessage, onSync);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    // useEffect(() => {
    //     let conv = '', trans = '';
    //     for (const entry of entries) {
    //         conv += `[${entry.timestamp}] ${entry.name === name ? 'Me' : name}:    ${entry.text}.\n`;
    //         trans += `[${entry.timestamp}] ${entry.name === name ? 'Me' : name}:    ${entry.translation || '...'}.\n`;
    //     }

    //     setConversation(conv);
    //     setTranslation(trans);
    // }, [entries]);

    useEffect(() => {
        if (entries.length === 0) return;
        if (entries.every(item => !!item.translation)) return;

        const translated = entries.filter((entry) => !entry.translation);
        if (translated.length === 0) return;
        translated.map(async (entry) => {
            entry.translation = await translate(entry.text, language, translateLanguage, status, setStatus)
            sendMessage({...entry, type: 'message'});
            setEntries([...entries], entry);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries]);

    useEffect(() => {
        if (!recognizedText) return;
        const entry = buildMessage(name, recognizedText, language);
        setEntries([...entries, entry])
        setRecognizingText('');
        setStatus((status | Status.LISTENING) & ~Status.RECOGNIZING);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recognizedText]);

    useEffect(() => {
        if (!recognizingText) return;
        setStatus(status | Status.RECOGNIZING);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [recognizingText]);

    function handleSummarizeClick() {
        setStatus(status | Status.SUMMARIZING);
        summarize(entries, language)
            .then((result) => {
                setSummarization(result);
            })
            .finally(() => setStatus(status & ~Status.SUMMARIZING));
    }

    async function handleStartSttClick() {
        setStatus(Status.INITIALIZING);
        await startSttFromMic(language, setRecognizingText, setRecognizedText, status, setStatus);
        setStatus(Status.LISTENING);
    }

    async function handleStopSttClick() {
        setStatus(Status.STOPPING);
        await stopSttFromMic(stopSttFromMic);
        setStatus(Status.IDLE);
    }

    return (
        <ThemeProvider theme={LPtheme}>
            <CssBaseline />
            <Box sx={{ bgcolor: 'background.default' }}>
                <Grid container spacing={4}>
                    <Grid item xs={4}>
                        <Typography variant="h3" component="div" gutterBottom paddingLeft={4}>
                            the Client-Side of Azure AI Services
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
                                        {status & Status.ACTIVE ?
                                            <Button variant="outlined" size="medium" fullWidth endIcon={<MicNone />} onClick={async () => await handleStopSttClick()} disabled={!name && status & Status.ACTIVE} >
                                                Stop
                                            </Button>
                                            : <Button variant="outlined" size="medium" fullWidth endIcon={<Mic />} onClick={async () => await handleStartSttClick()} disabled={!name && status & Status.INACTIVE} >
                                                Listen
                                            </Button>
                                        }
                                    </Item>
                                    <Item>
                                        <Button variant="outlined" size="medium" fullWidth endIcon={<Summarize />} onClick={handleSummarizeClick} disabled={entries.length < 1} >
                                            Summarize
                                        </Button>
                                    </Item>
                                </Stack>
                            </Grid>
                            <Grid item xs={10}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Chat entries={entries} name={name} />
                                    </Grid>
                                    {/* <Grid item xs={6}>
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
                                        {status === Status.TRANSLATING ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />}
                                        <TextField
                                            id="outlined-multiline-static"
                                            label="Translation"
                                            multiline
                                            rows={20}
                                            value={translation}
                                            fullWidth
                                        />
                                    </Grid> */}
                                    <Grid item xs={5}>
                                        {status & Status.ACTIVE && (status & Status.RECOGNIZING ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />)}
                                        {(status & Status.ACTIVE || status === Status.TRANSLATING) && <TextField
                                            id="outlined-multiline-static"
                                            label="Listening..."
                                            multiline
                                            rows={2}
                                            value={recognizingText}
                                            fullWidth
                                            error={!!(status & Status.NOMATCH)}
                                            helperText={status & Status.NOMATCH ? 'No natch, try again' : ''}
                                        />}
                                    </Grid>
                                    <Grid item xs={7}>
                                        {summarization && (status & Status.SUMMARIZING ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />)}
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