![Azure AI Services](/assets/services.png   )

# The Client-Side of Azure AI Services

[Introduction](#intro)  
[Scenario explaned](#scenario)  
[Prerequisites](#prerequisites)  
[Prepare the environment](#prepare)  
[Running it locally](#local)  
[Provision Azure Container App as a Next.js backend](#containerapp)  
[Resources Deployed in this solution (Azure)](#resources)  
[Links](#links)

## <a name="intro"></a>Introduction

The purpose of this solution is to enable apps to incorporate AI capabilities. In the upcoming demo, I will demonstrate how to **transcribe**, **translate**, and **summarize** conversations between customers and businesses without making significant modifications to your existing apps.

This app can be useful in various scenarios where two parties speak different languages and require simultaneous translation. For example, **it can be employed in call centers, where the representative and the customer do not speak the same language, by bank tellers dealing with foreign clients, by doctors communicating with elderly patients who do not speak the native language well**, and in other similar situations where both parties need to converse in their respective native languages.

This is the client-side of the Azure AI Services solution. It is a Next.js application that utilizes Azure AI services to offer real-time translation and summarization functionalities. The app utilizes Azure Speech, Translator, and Language services to provide the necessary features.

The app's backend is a slim Next.js Node.js server that uses Azure Web PubSub for Socket.IO to provide real-time, duplex communication between the client and the server. Furthermore, the Next.js slim backend is hosted using Azure Container Apps.

## <a name="scenario"></a>Scenario explaned

![Diagram](/assets/Translator.png)

![Steps](/assets/steps.png)


## <a name="prerequisites"></a>Prerequisites

> **Note:** This solution focus on the client-side of Azure AI Services. In order to keep the solution simple we will create the souronding resources manually using the Azure portal.

* Active Azure subscription. If you don't have an Azure subscription, you can [create one for free](https://azure.microsoft.com/free/cognitive-services/)
* [Create a Speech resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesSpeechServices) in the Azure portal.
* [Create a Translator resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextTranslation) in the Azure portal.
* [create a Language resource](https://portal.azure.com/#create/Microsoft.CognitiveServicesTextAnalytics) in the Azure portal
* [Create a Container Registry](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-get-started-portal?tabs=azure-cli) in the Azure portal.
* Create Azure Web PubSub for Socket.IO resource using [this guide](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/socketio-quickstart)


## <a name="prepare"></a>Prepare the environment

In this section we will cover the following:  
1. Get the repository.  
2. Set the Next.js environment variables (.env).  
3. Set the environment variables for the setup.sh script (.env.sh).  
4. Create App Registration service principal (GitHub secret).  
For the GitHub action to push the container image to the Azure Container Registry.  
5. Set the enviroment variables for the GitHub action.  


#### 1. Get the repository

[Fork](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo) this repository to your enviroment, so you can make changes to the code and deploy the changes to your Azure subscription.

```
mkdir azure-transcribe-translate

git clone https://github.com/<USERNAME>/azure-transcribe-translate.git azure-transcribe-translate
cd azure-transcribe-translate

# Optionally: configure Git to pull changes from the upstream repository into the local clone of your fork
git remote set-url origin https://github.com/userName/New_Repo
git remote add upstream https://github.com/userName/Repo
git push origin master
git push --all
```

#### 2. Set the Next.js environment variables (.env)
> **Note:** Next.js local server is using the .env file to load the environment variables. The .env file should be created in the root of the project.
> **Important**: The .env file should NOT be commited to the repository.
> Use the [env.sample](/env.sample) template, create a new .env file in the project root and replace the placeholders with the actual values.

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

#### 3. Set the environment variables for the setup.sh script (.env.sh)
> **Note:** [setup.sh](/setup.sh) script creates the Azure Container App resource that will run the Next.js server. The script is using the .env.sh file to load the environment variables. The .env.sh file should be created in the root of the project.
> Use the [env.sh.sample](/env.sample) template, create a new .env.sh file in the project root and replace the placeholders with the actual values.
> **Important**: The .env.sh file should NOT be commited to the repository.
> **Important**: The .env.sh file is dependent on the .env file we have created in the previous step.

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

#### 4. Create App Registration service principal (GitHub secret)

> The app registration service principal is used by the GitHub action to push the container image to the Azure Container Registry. The service principal should have the **Contributor** role at the Azure Container Registry level, AcrPush is not enuogh access to resource manger is needed too.

```
# login to azure
az login

# create an service principle on the Azure Container Registry level
az ad sp create-for-rbac --name aiservices-github --role AcrPush --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.ContainerRegistry/registries/${CONTAINER_REGISTRY} --sdk-auth

```

The command will result in a JSON output that looks like the JSON blobk bwlow,
**Copy the output and save it in a** [**GitHub secret**](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions#creating-secrets-for-a-repository) named AZURE_CREDENTIALS.:

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


#### 5. Set the enviroment variables for the GitHub action

At the GItHub repo setting, move to the **Variables** tab.
1. Set the **CONTAINER_REGISTRY** variable to the name of the Azure Container Registry.
2. Set the **RESOURCE_GROUP** variable for the resource group where you Container registry.


## <a name="local"></a>Running it locally
After creating the Azure resources and setting up the environment, you can run the Next.js app locally.

```
npm install
npm run dev
```

after the app is running, you can access it at [http://localhost:3000](http://localhost:3000)


## <a name="containerapp"></a>Provision Azure Container App as a Next.js backend

Run the [setup.sh](/setup.sh) script to create the Azure Container App resource that will run the Next.js server on Azure.

```
az login
./setup.sh
```

Wait for the app to be deployed, the result will be the FQDN of the Azure Container App. 
You can get the FQDN by running the following command:
```
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --query properties.configuration.ingress.fqdn 
```


> You can access it at the Application Url on the Container App resource overview blade.



## <a name="resources"></a>Resources Deployed in this solution (Azure)

![Azure AI Services](/assets/azure-resources.png)

* Container Registry: for the next.js app container image.
* Container App (& Container App Environment)  : for the next.js app.
* Language Service: for the conversation summarization.
* Log Analytics Workspace: for the logs of the container app.
* Web PubSub for Socket.IO: for the real-time, duplex communication between the client and the server.
* Speech service: for the speech-to-text transcription capbilites.
* Translator service: for the translation capabilities.


## <a name="improve"></a>Adding aiservices role

az role assignment create --assignee <CONTAINER_APP_PRINCIPAL_ID> --role Contributor --scope /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP/providers/Microsoft.ContainerRegistry/registries/$CONTAINER_REGISTRY



## Improve recognition accuracy with custom speech
[What is custom speech?](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/custom-speech-overview)

#### How does it work?
With custom speech, you can upload your own data, test and train a custom model, compare accuracy between models, and deploy a model to a custom endpoint.

![Custom Speech](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/media/custom-speech/custom-speech-overview.png)


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