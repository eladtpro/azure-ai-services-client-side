import { getSpeechToken, Status } from './utils';
const speechsdk = require('microsoft-cognitiveservices-speech-sdk')

let recognizer = undefined;

function logText(newText) {
    console.log(newText);
}

export async function startSttFromMic(language, setRecognizingText, setRecognizedText, status, setStatus) {
    const tokenObj = await getSpeechToken();
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.token, tokenObj.region);
    if (language)
        speechConfig.speechRecognitionLanguage = language;

    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);

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
}