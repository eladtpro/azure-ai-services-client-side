'use client'

import React, { useEffect, useState } from 'react';
// import Image from "next/image";
import { Grid, Stack, Box, TextField, Typography, LinearProgress, Button, IconButton, Tooltip } from '@mui/material';
import { Mic, MicNone, Summarize } from '@mui/icons-material';
import { translate, summarize, buildMessage, Status, getConfig } from '../utils';
import { Language, Name, Summarization, Chat } from './components';
import { startSttFromMic, stopSttFromMic } from '../stt';
import { registerSocket, sendMessage } from '../socket';

export default function App() {
    const [entries, setEntries] = useState([]);
    const [status, setStatus] = useState(Status.IDLE);
    const [summarization, setSummarization] = useState(undefined);
    const [recognizedText, setRecognizedText] = useState('');
    const [recognizingText, setRecognizingText] = useState('');
    const [language, setLanguage] = useState('he-IL');
    const [translateLanguage, setTranslateLanguage] = useState('en-US');
    const [name, setName] = useState('');
    const [config, setConfig] = useState(undefined);
    const [socketEntry, setSocketEntry] = useState(undefined);

    useEffect(() => {
        if (!socketEntry) return;
        if (!name) return;
        if (!entries) return;
        if (!setEntries) return;
        if (socketEntry.name === name) return;
        if (socketEntry.type !== 'message') return;
        if (entries.findIndex((entry) => entry.id === socketEntry.id) !== -1) return;
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
        registerSocket(config.socketEndpoint, onMessage, onSync);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config]);

    useEffect(() => {
        if (entries.length === 0) return;
        if (entries.every(item => !!item.translation)) return;

        const translated = entries.filter((entry) => !entry.translation);
        if (translated.length === 0) return;
        translated.map(async (entry) => {
            entry.translation = await translate(entry.text, language, translateLanguage, status, setStatus)
            sendMessage && sendMessage(entry);
            setEntries([...entries], entry);
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entries]);

    useEffect(() => {
        if (!recognizedText) return;
        const entry = buildMessage(name, recognizedText, language, translateLanguage);
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
        <Box>
            <Grid container spacing={4}>
                <Grid item xs={12}>
                    <Typography variant="h4" component="div" gutterBottom paddingLeft={2}>
                        The Client-Side of Azure AI Services
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    <Stack spacing={4} direction="row" maxWidth={200}>
                        <Name value={name} lalbel="Name" onChange={setName} fullWidth />
                        <Language
                            lalbel="Spoken language"
                            value={language}
                            onChange={setLanguage}
                        />
                        <Language
                            lalbel="Translated language"
                            value={translateLanguage}
                            onChange={setTranslateLanguage}
                        />
                        {status & Status.ACTIVE ?
                            <Tooltip title="Stop">
                                <span>
                                    <IconButton aria-label='Stop' onClick={async () => await handleStopSttClick()} disabled={!name && (status & Status.ACTIVE)} >
                                        <MicNone />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            :
                            <Tooltip title="Listen">
                                <span>
                                    <IconButton onClick={async () => await handleStartSttClick()} disabled={!name && (status & Status.INACTIVE) === 0} >
                                        <Mic />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        }
                        <Tooltip title="Summarize">
                            <span>
                                <IconButton onClick={handleSummarizeClick} disabled={entries.length < 1} >
                                    <Summarize />
                                </IconButton>
                            </span>
                        </Tooltip>

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
                    {summarization && (status & Status.SUMMARIZING ? <LinearProgress /> : <LinearProgress variant="determinate" value={0} />)}
                    {summarization && <Summarization result={summarization} />}
                </Grid>
            </Grid>
        </Box>
    );
}