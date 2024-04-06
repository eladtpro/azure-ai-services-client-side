'use client'

import React, { useEffect, useState } from 'react';
import { Grid, Stack, Box, TextField, Typography, LinearProgress, Button, FormControlLabel, Checkbox } from '@mui/material';
import { Mic, MicNone, Summarize, DeleteSweep, SyncAlt } from '@mui/icons-material';
import { translate, summarize, buildMessage, Status, getConfig } from '../utils';
import { Language, Name, Summarization, Chat } from './components';
import { startSttFromMic, stopSttFromMic, speakText } from '../stt';
import { registerSocket, sendMessage, syncMessages, clearMessages } from '../socket';

export default function App() {
    const [entries, setEntries] = useState([]);
    const [status, setStatus] = useState(Status.IDLE);
    const [summarization, setSummarization] = useState([]);
    const [recognizedText, setRecognizedText] = useState('');
    const [recognizingText, setRecognizingText] = useState('');
    const [language, setLanguage] = useState('he-IL');
    const [partnerLanguage, setPartnerLanguage] = useState('en-US');
    const [name, setName] = useState('');
    const [config, setConfig] = useState(undefined);
    const [socketEntry, setSocketEntry] = useState(undefined);
    const [speak, setSpeak] = useState(false);

    useEffect(() => {
        if (!socketEntry) return;
        if (!!name && socketEntry.name === name) return;
        if (!entries) return;
        if (!setEntries) return;
        if (socketEntry.type !== 'message') return;
        if (entries.findIndex((entry) => entry.id === socketEntry.id) !== -1) return;

        const translateEntry = async (entry) => {
            if (!entry[language]) {
                entry[language] = await translate(entry.text, partnerLanguage, language, status, setStatus);
                const copy = [entry, ...entries];
                copy.sort((a, b) => b.id.localeCompare(a.id));
                setEntries(copy);

                if (speak)
                    speakText(entry[language]);
            }
        }

        translateEntry(socketEntry);
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
        registerSocket(config.socketEndpoint, onMessage, onSync);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    useEffect(() => {
        if (!recognizedText) return;
        const entry = buildMessage(name, recognizedText, language);
        sendMessage && sendMessage(entry);
        setEntries([entry, ...entries])
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
        summarize(name, entries, language, status, setStatus)
            .then((result) => {
                setSummarization(result);
            });
    }

    async function handleStartSttClick() {
        setStatus(Status.INITIALIZING);
        await startSttFromMic(language, speak, setRecognizingText, setRecognizedText, status, setStatus);
        setStatus(Status.LISTENING);
    }

    async function handleStopSttClick() {
        setStatus(Status.STOPPING);
        await stopSttFromMic(stopSttFromMic);
        setStatus(Status.IDLE);
    }

    function handleSpeakChange(event) {
        setSpeak(event.target.checked);
    }

    return (
        <Box>
            <Grid container spacing={2} margin={1}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="div" gutterBottom paddingLeft={2}>
                        The Client-Side of Azure AI Services
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={2} direction="row" maxWidth={200}>
                        <Name value={name} lalbel="Name" onChange={setName} fullWidth />
                        <Language
                            lalbel="Spoken language"
                            value={language}
                            onChange={setLanguage}
                        />
                        <Language
                            lalbel="Translated language"
                            value={partnerLanguage}
                            onChange={setPartnerLanguage}
                        />
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={2} direction="row" maxWidth={200}>
                        {status & Status.ACTIVE ?
                            <Button variant="outlined" startIcon={<MicNone />} onClick={async () => await handleStopSttClick()} disabled={!name && (status & Status.ACTIVE) === 0}>
                                Stop
                            </Button>
                            :
                            <Button variant="outlined" startIcon={<Mic />} onClick={async () => await handleStartSttClick()} disabled={!name && (status & Status.INACTIVE) === 0}>
                                Listen
                            </Button>
                        }
                        <Button variant="outlined" startIcon={<Summarize />} onClick={handleSummarizeClick} disabled={entries.length < 1}>
                            Summarize
                        </Button>
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={2} direction="row" maxWidth={200}>
                        <Button variant="outlined" startIcon={<SyncAlt />} onClick={syncMessages} disabled={entries.length < 1}>
                            Sync
                        </Button>
                        <Button variant="outlined" startIcon={<DeleteSweep />} onClick={clearMessages} disabled={entries.length < 1}>
                            Clear
                        </Button>
                        <FormControlLabel control={
                            <Checkbox
                                checked={speak}
                                onChange={handleSpeakChange}
                            />
                        } label="Speak" />
                    </Stack>
                </Grid>
                <Grid item xs={12}>
                    <Chat entries={entries} name={name} />
                </Grid>
                <Grid item xs={5}>
                    {(status & Status.ACTIVE) !== 0 && (status & Status.RECOGNIZING ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />)}
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
                    {(status & Status.SUMMARIZING) ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />}
                    {summarization.length > 0 && <Summarization result={summarization} />}
                </Grid>
            </Grid>
        </Box>
    );
}