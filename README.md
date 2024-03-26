![Azure AI Services](/assets/Translator.png)
# The Client-Side of Azure AI Services




## Introduction

## Prerequisites

* Active Azure subscription. If you don't have an Azure subscription, you can [create one for free](https://azure.microsoft.com/free/cognitive-services/)
* [Create a Speech resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) in the Azure portal.
* [Create a Translator resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation) in the Azure portal.
* [create a Language resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextAnalytics) in the Azure portal
* Create Azure PubSub for Socket.io resource using this guide


## Prepare the environment

#### Set environment variables

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



## Resources

![Azure AI Services](/assets/azure-resources.png)




## Links

* [How to use conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization)
* [Build a real-time code-streaming app by using Socket.IO and host it on Azure](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/socketio-build-realtime-code-streaming-app)
* [Update and deploy changes in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/revisions)
* [Language support for document and conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/language-support)
* [Socket.io Server options](https://socket.io/docs/v4/server-options/)
* [az containerapp](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest)