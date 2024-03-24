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

  echo "Setting the storage account $STORAGE_ACCOUNT_NAME for the environment $CONTAINER_ENVIRONMENT_NAME..."
  az containerapp env storage set --name $CONTAINER_ENVIRONMENT_NAME --resource-group $RESOURCE_GROUP \
    --storage-name $STORAGE_SHARE_NAME \
    --azure-file-account-name $STORAGE_ACCOUNT_NAME \
    --azure-file-account-key $STORAGE_ACCOUNT_KEY \
    --azure-file-share-name $STORAGE_SHARE_NAME \
    --access-mode ReadWrite
else
    echo "Environment $name already exists."
fi

echo "Checking if the container app job $CONTAINER_APP_NAME exists..."
names=$(az containerapp job list --resource-group=$RESOURCE_GROUP --query "[].name" -o tsv)
if [[ $names == *"$CONTAINER_APP_NAME"* ]]; then
    echo "Job $CONTAINER_APP_NAME already exists in $names."
else
  env_vars=""
  while IFS='=' read -r key value
  do
    env_vars="$env_vars $key=\"${value}\""
  done < .env

  az containerapp create \
      --name $CONTAINER_APP_NAME --resource-group $RESOURCE_GROUP --environment $CONTAINER_ENVIRONMENT_NAME \
      --trigger-type "Event" \
      --image $CONTAINER_APP_IMAGE \
      --registry-server $CONTAINER_REGISTRY_SERVER \
      --registry-identity $CONTAINER_REGISTRY_IDENTITY \
      --cpu "0.25" --memory "0.5Gi" \
      --secrets "connection-string-secret=$STORAGE_CONNECTION_STRING" \
    --env-vars $env_vars
    


    #     "MOUNT_PATH=$MOUNT_PATH" \
    #     "AZURE_STORAGE_CONNECTION_STRING=secretref:connection-string-secret" \
    #     "SOURCE_CONTAINER_NAME=requests" \
    #     "WORKING_CONTAINER_NAME=processing" \
    #     "COMPLETED_CONTAINER_NAME=completed"
    #     "ARM_USE_MSI=$ARM_USE_MSI"
    #     "ARM_SUBSCRIPTION_ID=$ARM_SUBSCRIPTION_ID"
    #     "ARM_TENANT_ID=$ARM_TENANT_ID"
    #     "ARM_CLIENT_ID=$ARM_CLIENT_ID"
fi

# show the job yaml
az containerapp job show \
  --name $CONTAINER_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --output yaml > job.yaml

# az ad sp create-for-rbac 
#   --name $CONTAINER_APP_NAME --role contributor \
#   --scopes /subscriptions/$SUBSCRIPTION_ID/resourceGroups/$RESOURCE_GROUP \
#   --json-auth
