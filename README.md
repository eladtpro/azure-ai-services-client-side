# The Client-Side of Azure AI Services
![Azure AI Services](/assets/services.png)


The purpose of this solution is to enable applications to incorporate AI capabilities. In the upcoming demo, I will showcase how to **transcribe and speech (Azure AI Speech)**, **translate (Azure AI Translator)** and **summarize (Azure AI Language)** conversations between customers and businesses without significantly modifying your existing apps.

This application can be helpful in various scenarios where two parties speak different languages and require simultaneous translation. For instance, it can be employed in **call centers** where the representative and the customer do not speak the same language, by **bank tellers dealing with foreign clients**, by **doctors communicating with elderly patients** who do not speak the native language well, and in other similar situations where both parties need to converse in their respective native languages.

We will use the **React.js** client-side SDK and REST APIs of the **Azure AI Services** in this solution. The application's backend is a slim **Next.js** Node.js server that uses **Azure Web PubSub for Socket.IO**
 to provide real-time, duplex communication between the client and the server. Furthermore, the Next.js slim backend is hosted using Azure Container Apps.

## <a name="scenario"></a>Scenario explaned

![Diagram](/assets/Translator.png)

![Steps](/assets/steps.png)

---

[Prerequisites](#prerequisites)  
[Prepare the environment](#prepare)  
[Run it locally](#local)  
[Run it as an Azure Container App](#containerapp)  
[Sample Application - how to use it](#app)  
[Resources Deployed in this solution (Azure)](#resources)  
[Improve recognition accuracy with custom speech](#improve)  
[Conclusion](#con)  
[Links](#links)  



## <a name="prerequisites"></a>Prerequisites

> **Note:** This solution focus on the client-side of Azure AI Services. In order to keep the solution simple we will create the souronding resources manually using the Azure portal.

* Active Azure subscription. If you don't have an Azure subscription, you can [create one for free](https://azure.microsoft.com/free/cognitive-services/)
* [Create a Speech resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) in the Azure portal.
* [Create a Translator resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation) in the Azure portal.
* [create a Language resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextAnalytics) in the Azure portal
* [Create a Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal?tabs=azure-cli) in the Azure portal.
* Create Azure Web PubSub for Socket.IO resource using [this guide](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/socketio-quickstart)


## <a name="prepare"></a>Prepare the environment

#### Clone the repository

```
git clone https://github.com/eladtpro/azure-ai-services-client-side.git
```

#### Set the Next.js environment variables (.env)
> **Note**: The Next.js local server requires loading environment variables from the .env file. Use the [env.sample](/env.sample) template to create a new .env file in the project root and replace the placeholders with the actual values.
> **Important**: It is essential to keep in mind that the .env file should NEVER be committed to the repository.

The .env file should look like this:
```
WEBSITE_HOSTNAME=http://localhost:3001
NODE_ENV='development'
PORT=3000
SOCKET_PORT=29011
SOCKET_ENDPOINT=https://<SOCKET_IO_SERVICE>.webpubsub.azure.com
SOCKET_CONNECTION_STRING=<SOCKET_IO_CONNECTION_STRING>
SPEECH_KEY=<SPEECH_KEY>
SPEECH_REGION=westeurope
LANGUAGE_KEY=<LANGUAGE_KEY>
LANGUAGE_REGION=westeurope
LANGUAGE_ENDPOINT=https://<LANGUAGE_SERVICE>.cognitiveservices.azure.com/
TRANSLATE_KEY=<TRANSLATE_KEY>
TRANSLATE_ENDPOINT=https://api.cognitive.microsofttranslator.com/
TRANSLATE_REGION=westeurope
```

#### Set the environment variables for the setup.sh script (.env.sh)
> **Note**: To set up the Azure Container App resource running the Next.js server, you need to set the environment variables for the [setup.sh](/setup.sh) script. The script uses the .env.sh file to load these variables, which should be created at the project's root. You can use the [.env.sh.sample](/.env.sample) template to create a new .env.sh file in the project root. Replace the placeholders in the template with the actual values.
> **Important**: The .env.sh file must NOT be committed to the repository.
> **Important**: The .env.sh file depends on the .env file we created in the previous step.

The .env.sh file should look like this:
```
RESOURCE_GROUP=<RESOURCE_GROUP>
LOCATION=westeurope
CONTAINER_APP_NAME=aiservices
CONTAINER_APP_IMAGE=<CONTAINER_REGISTRY>.azurecr.io/aiservices:latest
CONTAINER_APP_PORT=80
CONTAINER_REGISTRY_SERVER=<CONTAINER_REGISTRY>.azurecr.io
CONTAINER_REGISTRY_IDENTITY=system
CONTAINER_ENVIRONMENT_NAME=env-ai-services
LOGS_WORKSPACE_ID=<LOGS_WORKSPACE_ID>
LOGS_WORKSPACE_KEY=<LOGS_WORKSPACE_KEY>
SUBSCRIPTION_ID=<SUBSCRIPTION_ID>
```

#### Create a service principal (App registration) and save it as a GitHub secret

> **Note**: The GitHub action employs the app registration service principal to handle two roles. First, it pushes the images to the Azure Container Registry (ACR). Second, it deploys Azure Container Apps. To perform these roles, the service principal must have a **Contributor** role on the Azure resource group.

```
# login to azure
az login
# create an service principle at the resource group level
az ad sp create-for-rbac --name aiservices-github --role Contributor --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP} --sdk-auth
```
The below command will result a JSON formatted output that looks like the JSON block below,
Copy the output and save it in a [GitHub secret](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) named AZURE_CREDENTIALS.


```
{
  "clientId": "00000000-0000-0000-0000-000000000000",
  "clientSecret": "00000000000000000000000000000000",
  "subscriptionId": "00000000-0000-0000-0000-000000000000",
  "tenantId": "00000000-0000-0000-0000-000000000000",
  "activeDirectoryEndpointUrl": "https://login.microsoftonline.com",
  "resourceManagerEndpointUrl": "https://management.azure.com/",
  "activeDirectoryGraphResourceId": "https://graph.windows.net/",
  "sqlManagementEndpointUrl": "https://management.core.windows.net:8443/",
  "galleryEndpointUrl": "https://gallery.azure.com/",
  "managementEndpointUrl": "https://management.core.windows.net/"
}
```
![GitHub secret](/assets/repo-secrets.png)


#### Set other enviroment variables for the GitHub action

At the GItHub repo setting, move to the **Variables** tab.
1. Set the **CONTAINER_REGISTRY** variable to the name of the Azure Container Registry.
2. Set the **RESOURCE_GROUP** variable for the resource group where you Container registry.
3. Set the **CONTAINER_APP_NAME** variable to the name of the Azure Container App.

![GitHub environment variables](/assets/repo-vars.png)

## <a name="local"></a>Run it locally
After creating the Azure resources and setting up the environment, you can run the Next.js app locally.

```
npm install
npm run dev
```

This command will start the Next.js server on port 3000. The server will also serve the client-side static files.
After the app is running, you can access it locally at [http://localhost:3000](http://localhost:3000).

## <a name="containerapp"></a>Run it as an Azure Container App

Run the [setup.sh](/setup.sh) script to create the Azure Container App resource to run the Next.js server on Azure.

```
az login
./setup.sh
```

Wait for the app to be deployed, the result will be the FQDN of the Azure Container App. 
> **Note**: You can get the FQDN by running the following command:
```
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn 
```


> **Note:** You can also get the Application Url on the Container App resource overview blade.

We have completed the setup part.  
Now, you can access the app using the Azure Container App URL.

## <a name="app"></a>Sample Application - how to use it

![App](/assets/animated-80-110-800px.gif)
![App](/assets/buttons.png)

* **Spoken language**: Select the language of the speaker.
* **Translated language**: Select the language to which the spoken language will be translated.
* **Listen**: Start the speech-to-text transcription, this will use the [Speech to text SDK for JavaScript package](https://learn.microsoft.com/en-us/javascript/api/microsoft-cognitiveservices-speech-sdk/?view=azure-node-latest).
> Reference code: [stt.js](/src/stt.js):   
```
    // stt.js
    // intialize the speech recognizer
    const speechConfig = speechsdk.SpeechConfig.fromAuthorizationToken(tokenObj.token, tokenObj.region);
    const audioConfig = speechsdk.AudioConfig.fromDefaultMicrophoneInput();
    recognizer = new speechsdk.SpeechRecognizer(speechConfig, audioConfig);
    // register the event handlers
    ...
    // listen and transcribe
    recognizer.startContinuousRecognitionAsync();
```
* **Stop**: Stop the speech-to-text transcription.
> Reference code: [stt.js](/src/stt.js):   
```
    // stt.js
    // stop the speech recognizer
    recognizer.stopContinuousRecognitionAsync();
```
* **Translate**: On the listener side each recognized phrase will be translated to the selected language using the [Text Translation REST API](https://learn.microsoft.com/en-us/azure/ai-services/translator/reference/rest-api-guide).
> Reference code: [utils.js](/src/utils.js):   
```
    // utils.js
    ...
    const res = await axios.post(`${config.translateEndpoint}translate?api-version=3.0&from=${from}&to=${to}`, data, headers);
    return res.data[0].translations[0].text;
```
* **Summarize**: Summarize the conversation. for this we will use the Azure Language Service [Conversation Summarization API](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization).
> Reference code: [utils.js](/src/utils.js):   
```
    // utils.js
    ...
    let res = await axios.post(`${config.languageEndpoint}language/analyze-conversations/jobs?api-version=2023-11-15-preview`, data, headers);
    const jobId = res.headers['operation-location'];

    let completed = false
    while (!completed) {
        res = await axios.get(`${jobId}`, headers);
        completed = res.data.tasks.completed > 0;
    }

    const conv = res.data.tasks.items[0].results.conversations[0].summaries.map(summary => {
        return { aspect: summary.aspect, text: summary.text }
    });
    return conv;
```
* **Speak**: The translated text will be synthesized to speech using the [Text to Speech JavaScript package](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis?tabs=browserjs%2Cterminal&pivots=programming-language-javascript).
> Reference code: [stt.js](/src/stt.js):   
```
    // stt.js
    // intialize the speech synthesizer
    speechConfig.speechSynthesisVoiceName = speakLanguage;
    const synthAudioConfig = speechsdk.AudioConfig.fromDefaultSpeakerOutput();
    synthesizer = new speechsdk.SpeechSynthesizer(speechConfig, synthAudioConfig);
    ...
    // speak the text
    synthesizer.speakTextAsync(text,
        function (result) {
            if (result.reason === speechsdk.ResultReason.SynthesizingAudioCompleted) {
                console.log("synthesis finished.");
            } else {
                console.error("Speech synthesis canceled, " + result.errorDetails +
                    "\nDid you set the speech resource key and region values?");
            }
        });
```
* **Clear**: Clear the conversation history.
> Reference code: [socket.js](/src/socket.js):   
```
    // socket.js
    clearMessages = () =>
        socket.emit('clear');
```
* **Sync**: Sync the conversation history between the two parties.
> Reference code: [socket.js](/src/socket.js):   
```
    // socket.js
    syncMessages = () =>
        socket.emit('sync');
```

## <a name="resources"></a>Resources Deployed in this solution (Azure)

![Azure AI Services](/assets/azure-resources.png)

* Container Registry: for the next.js app container image.
* Container App (& Container App Environment): for the next.js app.
* Language Service: for the conversation summarization.
* Log Analytics Workspace: for the logs of the container app.
* Web PubSub for Socket.IO: for the real-time, duplex communication between the client and the server.
* Speech service: for the speech-to-text transcription capbilites.
* Translator service: for the translation capabilities.


## <a name="improve"></a>Improve recognition accuracy with custom speech
> Source: [What is custom speech?](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview)

#### How does it work?
With custom speech, you can upload your own data, test and train a custom model, compare accuracy between models, and deploy a model to a custom endpoint.

![Custom Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/media/custom-speech/custom-speech-overview.png)


Here's more information about the sequence of steps shown in the previous diagram:

1. [Create a project](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-create-project) and choose a model. Use a [Speech resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) that you create in the Azure portal. If you train a custom model with audio data, choose a Speech resource region with dedicated hardware for training audio data. For more information, see footnotes in the [regions](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/regions#speech-service) table.
2. [Upload test data](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-upload-data). Upload test data to evaluate the speech to text offering for your applications, tools, and products.
3. [Test recognition quality](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-inspect-data). Use the [Speech Studio](https://aka.ms/speechstudio/customspeech) to play back uploaded audio and inspect the speech recognition quality of your test data.
4. [Test model quantitatively](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-evaluate-data). Evaluate and improve the accuracy of the speech to text model. The Speech service provides a quantitative word error rate (WER), which you can use to determine if more training is required.
5. [Train a model](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-train-model). Provide written transcripts and related text, along with the corresponding audio data. Testing a model before and after training is optional but recommended.
6. [Deploy a model](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-custom-speech-deploy-model). Once you're satisfied with the test results, deploy the model to a custom endpoint. Except for [batch transcription](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/batch-transcription), you must deploy a custom endpoint to use a custom speech model.


## <a name="con"></a>Conclusion
We demonstrated how to use Azure AI Services to enable apps to incorporate AI capabilities for transcribing, translating, summarizing, and speaking conversations between customers and businesses with minimum effort on existing apps and focusing on the client side capabilities. These features can be helpful in scenarios where two parties speak different languages, such as call centers, banks, and medical clinics.

![App](/assets/demo-full.gif)


## <a name="links"></a>Links
* [Use continuous speech recognition](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-recognize-speech?pivots=programming-language-javascript#use-continuous-recognition)
* [How to synthesize speech from text](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/how-to-speech-synthesis?tabs=browserjs%2Cterminal&pivots=programming-language-javascript)
* [Quickstart: Convert text to speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/get-started-text-to-speech?tabs=windows%2Cterminal&pivots=programming-language-javascript)
* [Speech React browser-based JavaScript sample](https://github.com/Azure-Samples/AzureSpeechReactSample)
* [Implement language identification](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-identification?tabs=once&pivots=programming-language-javascript)
* [How to use conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization)
* [Build a real-time code-streaming app by using Socket.IO and host it on Azure](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/socketio-build-realtime-code-streaming-app)
* [Update and deploy changes in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/revisions)
* [Language support for document and conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/language-support)
* [Language and voice support for the Speech service](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts#prebuilt-neural-voices)
* [Socket.io Server options](https://socket.io/docs/v4/server-options/)
* [az containerapp](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest)


