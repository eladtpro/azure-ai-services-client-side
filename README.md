![Azure AI Services](/assets/services.png   )

# The Client-Side of Azure AI Services

[Introduction](#intro)
[Scenario explaned](#scenario)
[Prerequisites](#prerequisites)
[Prepare the environment](#prepare)
[Resources Deployed in this solution (Azure)](#resources)
[Links](#links)

## <a name="intro"></a>Introduction

This is the client-side of the Azure AI Services solution. It is a Next.js application that utilizes Azure AI services to provide real-time translation and summarization capabilities. The app leverages Azure Speech, Translator, and Language services to deliver the required features. 

The app's backend is a slim Next.js Node.js server that uses Azure Web PubSub for Socket.IO to provide real-time, duplex communication between the client and the server. Additionally, the Next.js slim backend is hosted using Azure Container Apps.

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
1. Fork the repository.
2. clone the repository to your local machine.
3. Set the Next.js environment variables (.env).
4. Set the environment variables for the setup.sh script (.env.sh).
5. Create App Registration service principal. For letting the GitHub action to push the container image to the Azure Container Registry.
6. Save the service principal credentials in GitHub secrets and GitHub enviroment variables.


#### 1. Fork the repository
1. On GitHub.com, navigate to the [octocat/Spoon-Knife](https://github.com/eladtpro/azure-transcribe-translate.git) repository.
2. In the top-right corner of the page, click Fork.
![Fork](/assets/fork-button.webp)
3. Under "Owner," select the dropdown menu and click an owner for the forked repository.
4. By default, forks are named the same as their upstream repositories. Optionally, to further distinguish your fork, in the "Repository name" field, type a name.
5. Select **Copy the DEFAULT branch only**.
6. Click **Create fork**.


#### 2. Clone the repository to your local machine

> **Note:** Replace `<USERNAME>` with your GitHub username.
> **Note:** For more deatails about fork and clone a repository please refer to the [GitHub documentation](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo)

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

#### 3. Set the Next.js environment variables (.env)
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

#### 4. Set the environment variables for the setup.sh script (.env.sh)
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

#### 5. Create App Registration service principal

```
# login to azure
az login

# create an service principle on the Azure Container Registry level
az ad sp create-for-rbac --name aiservices --role AcrPush --scopes /subscriptions/${SUBSCRIPTION_ID}/resourceGroups/${RESOURCE_GROUP}/providers/Microsoft.ContainerRegistry/registries/${CONTAINER_REGISTRY} --json-auth
```

The command will result in a JSON output that looks like this:
```
{
  "appId": "00000000-0000-0000-0000-000000000000",
  "displayName": "aiservices",
  "name": "http://aiservices",
  "password": "00000000-0000-0000-0000-000000000000",
  "tenant": "00000000-0000-0000-0000-000000000000"
}
```

#### 6. Save the service principal credentials in GitHub secrets and GitHub enviroment variables
1. On GitHub.com, navigate to the main page of the repository.
2. Under your repository name, click  Settings. If you cannot see the "Settings" tab, select the  dropdown menu, then click Settings.
![Settings](/assets/repo-actions-settings.webp)
3. In the "Security" section of the sidebar, select  Secrets and variables, then click Actions.
4. Click the Secrets tab.
![Secrets](/assets/actions-secrets-tab.webp)
5. Click New repository secret.
6. In the Name field, type **AZURE_CREDENTIALS** as a name for your secret.
7. In the Secret field, enter the the output of the previous step as value for your secret.
8. Click Add secret.

1. Move to the **Variables** tab.
2. Set the **CONTAINER_REGISTRY** variable to the name of the Azure Container Registry.
3. Set the **RESOURCE_GROUP** variable for the resource group where you Container registry.





## <a name="resources"></a>Resources Deployed in this solution (Azure)

![Azure AI Services](/assets/azure-resources.png)

* Container Registry: for the next.js app container image.
* Container App (& Container App Environment)  : for the next.js app.
* Language Service: for the conversation summarization.
* Log Analytics Workspace: for the logs of the container app.
* Web PubSub for Socket.IO: for the real-time, duplex communication between the client and the server.
* Speech service: for the speech-to-text transcription capbilites.
* Translator service: for the translation capabilities.
* Container registry webhook: Container reagistry webhook to be used by the Container App.


## <a name="links"></a>Links

* [How to use conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/how-to/conversation-summarization)
* [Build a real-time code-streaming app by using Socket.IO and host it on Azure](https://learn.microsoft.com/en-us/azure/azure-web-pubsub/socketio-build-realtime-code-streaming-app)
* [Update and deploy changes in Azure Container Apps](https://learn.microsoft.com/en-us/azure/container-apps/revisions)
* [Language support for document and conversation summarization](https://learn.microsoft.com/en-us/azure/ai-services/language-service/summarization/language-support)
* [Socket.io Server options](https://socket.io/docs/v4/server-options/)
* [az containerapp](https://learn.microsoft.com/en-us/cli/azure/containerapp?view=azure-cli-latest)