#!/bin/bash

# Source the environment variables
source ./.env.sh

echo "Checking if the resource group $RESOURCE_GROUP exists..."
if az group exists --name $RESOURCE_GROUP; then
    echo "Resource group $RESOURCE_GROUP already exists."
else
  az group create \
    --name $RESOURCE_GROUP \
    --location $LOCATION \
    --query "properties.provisioningState"
fi

echo "Checking if the container app env $CONTAINER_ENVIRONMENT_NAME exists..."
name="$(az containerapp env show --name $CONTAINER_ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP --query name)"
if [[ -z "$name" ]]; then
  az containerapp env create \
    --name $CONTAINER_ENVIRONMENT_NAME \
    --resource-group $RESOURCE_GROUP \
    --location $LOCATION \
    --logs-workspace-id $LOGS_WORKSPACE_ID \
    --logs-workspace-key $LOGS_WORKSPACE_KEY \
    --query "properties.provisioningState"
else
    echo "Environment $name already exists."
fi

echo "Checking if the container app $CONTAINER_APP_NAME exists..."
names=$(az containerapp list --resource-group=$RESOURCE_GROUP --query "[].name" -o tsv)
if [[ $names == *"$CONTAINER_APP_NAME"* ]]; then
    echo "containerapp $CONTAINER_APP_NAME already exists in $names, updating..."
    az containerapp update \
      --name $CONTAINER_APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --image $CONTAINER_APP_IMAGE 
else
  env_vars=""
  while IFS='=' read -r key value
  do
    if [ "$key" = "NODE_ENV" ]; then
      value=production
    fi
    if [ "$key" = "PORT" ]; then
      value=$CONTAINER_APP_PORT
    fi
    env_vars="$env_vars $key=$value"
  done < .env

  az containerapp create \
      --name $CONTAINER_APP_NAME \
      --resource-group $RESOURCE_GROUP \
      --environment $CONTAINER_ENVIRONMENT_NAME \
      --image $CONTAINER_APP_IMAGE \
      --registry-server $CONTAINER_REGISTRY_SERVER \
      --registry-identity $CONTAINER_REGISTRY_IDENTITY \
      --cpu "0.25" --memory "0.5Gi" \
      --min-replicas 1 --max-replicas 1 \
      --ingress external --target-port $CONTAINER_APP_PORT \
      --env-vars $env_vars
fi


# env_vars can be used as secrets using the --secrets flag:
      # --secrets "connection-string-secret=$STORAGE_CONNECTION_STRING" \
      # --env-vars \
      #   "AZURE_STORAGE_CONNECTION_STRING=secretref:connection-string-secret" \


# show the job yaml
az containerapp show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output yaml > containerapp.yaml

# az ad sp create-for-rbac 
#   --name $CONTAINER_APP_NAME --role contributor \
#   --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
#   --json-auth
