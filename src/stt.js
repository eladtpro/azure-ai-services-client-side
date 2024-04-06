import { getSpeechToken, Status } from './utils';
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

let recognizer = undefined;
let synthesizer = undefined;

function logText(newText) {
    console.log(newText);
}

export function speakText(text) {
    if (synthesizer) {
        synthesizer.speakTextAsync(text,
            function (result) {
                if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                    console.log("synthesis finished.");
                } else {
                    console.error("Speech synthesis canceled, " + result.errorDetails +
                        "\nDid you set the speech resource key and region values?");
                }
            });
    }
}

export async function startSttFromMic(language, speak, setRecognizingText, setRecognizedText, status, setStatus) {
    const tokenObj = await getSpeechToken();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.token, tokenObj.region);
    if (language)
        speechConfig.speechRecognitionLanguage = language;
    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

    let speakLanguage = language;
    if (speak) {
        switch (language) {
            case 'he-IL':
                speakLanguage = 'he-IL-HilaNeural';
                break;
            case 'en-US':
                speakLanguage = 'en-US-AvaNeural';
                break;
            case 'ar-IL':
                speakLanguage = 'ar-EG-SalmaNeural';
                break;
            case 'ru-RU':
                speakLanguage = 'ru-RU-DariyaNeural';
                break;
            case 'am-ET':
                speakLanguage = 'am-ET-MekdesNeural';
                break;
            default:
                speakLanguage = 'en-US-JennyNeural';
                break;
        }

        speechConfig.speechSynthesisVoiceName = speakLanguage;
        const synthAudioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
        synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, synthAudioConfig);
    }

    recognizer.recognizing = (s, e) => {
        setRecognizingText(e.result.text);
    };

    recognizer.recognized = (s, e) => {
        if (e.result.reason === speechsdk.ResultReason.RecognizedSpeech) {
            setStatus(status & ~Status.NOMATCH)
            setRecognizedText(e.result.text);
        }
        else if (e.result.reason === speechsdk.ResultReason.NoMatch) {
            setStatus(status | Status.NOMATCH);

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
        recognizer.close();
        recognizer = undefined;
    };

    recognizer.sessionStopped = (s, e) => {
        logText("\n    Session stopped event.");
        recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
        recognizer = undefined;
    };

    logText('speak into your microphone...');

    recognizer.startContinuousRecognitionAsync();
}

export function changeLanguage(language) {
    if (recognizer) {
        recognizer.speechRecognitionLanguage = language;
    }
}

export async function stopSttFromMic() {
    if (recognizer) {
        recognizer.stopContinuousRecognitionAsync();
        recognizer.close();
        recognizer = undefined;
    }
    if (synthesizer) {
        synthesizer.close();
        synthesizer = undefined;
    }
}