import { SecretModel } from '@console/internal/models';
import {
  k8sCreate,
  k8sGet,
  k8sPatch,
  k8sUpdate,
  k8sKillByName,
} from '@console/internal/module/k8s/resource';

import {
  AccessTokenSecretName,
  ServiceAccountCRName,
  ServiceAccountSecretName,
  ServicesRequestCRName,
} from '../const';
import {
  KafkaConnectionModel,
  CloudServiceAccountRequest,
  CloudServicesRequestModel,
} from '../models/rhoas';
import { getFinishedCondition, isResourceStatusSuccessfull } from './conditionHandler';
import { k8sWaitForUpdate } from './k8sUtils';

/**
 * Create service account for purpose of supplying connection credentials
 *
 * @param currentNamespace
 */
export const createManagedServiceAccount = async (currentNamespace: string) => {
  const serviceAcct = {
    apiVersion: `${CloudServicesRequestModel.apiGroup}/${CloudServicesRequestModel.apiVersion}`,
    kind: CloudServiceAccountRequest.kind,
    metadata: {
      name: ServiceAccountCRName,
      namespace: currentNamespace,
      annotations: {
        refreshTime: new Date().toISOString(),
      },
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
      serviceAccountName: `RHOASOperator-ServiceAccount-${currentNamespace}`,
      serviceAccountDescription: 'Service account created by RHOASOperator to access services',
      serviceAccountSecretName: ServiceAccountSecretName,
      reset: false,
    },
  };

  return k8sCreate(CloudServiceAccountRequest, serviceAcct);
};

/**
 * Create request to fetch all kafkas from upstream
 */
export const createCloudServicesRequest = async function(currentNamespace: string) {
  const mkRequest = {
    apiVersion: `${CloudServicesRequestModel.apiGroup}/${CloudServicesRequestModel.apiVersion}`,
    kind: CloudServicesRequestModel.kind,
    metadata: {
      annotations: {
        refreshTime: new Date().toISOString(),
      },
      name: ServicesRequestCRName,
      namespace: currentNamespace,
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
    },
  };

  return k8sCreate(CloudServicesRequestModel, mkRequest);
};

export const patchServiceAccountRequest = async function(request: any) {
  const path = '/metadata/annotations/refreshTime';
  return k8sPatch(CloudServiceAccountRequest, request, [
    {
      path,
      op: 'replace',
      value: new Date().toISOString(),
    },
  ]);
};

export const patchCloudServicesRequest = async function(request: any) {
  const path = '/metadata/annotations/refreshTime';

  return k8sPatch(CloudServicesRequestModel, request, [
    {
      path,
      op: 'replace',
      value: new Date().toISOString(),
    },
  ]);
};

export const createCloudServicesRequestIfNeeded = async (currentNamespace) => {
  let currentRequest;
  try {
    currentRequest = await k8sGet(
      CloudServicesRequestModel,
      ServicesRequestCRName,
      currentNamespace,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info('rhoas: CloudServicesRequest already exist');
  }

  if (currentRequest) {
    return patchCloudServicesRequest(currentRequest);
  }
  return createCloudServicesRequest(currentNamespace);
};

export const createSecretIfNeeded = async function(
  currentNamespace: string,
  apiTokenValue: string,
) {
  let currentSecret;
  try {
    currentSecret = await k8sGet(SecretModel, AccessTokenSecretName, currentNamespace);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.info("rhoas: auth secret doesn't exist");
  }

  if (currentSecret) {
    delete currentSecret.data;
    currentSecret.stringData = { value: apiTokenValue };
    return k8sUpdate(SecretModel, currentSecret);
  }
  const secret = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      name: AccessTokenSecretName,
      namespace: currentNamespace,
    },
    stringData: {
      value: apiTokenValue,
    },
  };
  return k8sCreate(SecretModel, secret);
};

export const createServiceAccountIfNeeded = async (currentNamespace) => {
  let rhoasServiceAccount;
  try {
    rhoasServiceAccount = await k8sGet(
      CloudServiceAccountRequest,
      ServiceAccountCRName,
      currentNamespace,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    // console.info("rhoas: ServiceAccount doesn't exist. Creating new ServiceAccount");
  }
  let request;
  if (rhoasServiceAccount) {
    request = await patchServiceAccountRequest(rhoasServiceAccount);
  } else {
    request = await createManagedServiceAccount(currentNamespace);
  }

  await k8sWaitForUpdate(
    CloudServiceAccountRequest,
    request,
    (resource) => {
      const condition = getFinishedCondition(resource);

      if (condition) {
        if (isResourceStatusSuccessfull(resource)) {
          return true;
        }
        const errorToLog = condition.message;
        throw new Error(errorToLog);
      }
      return false;
    },
    10000,
  );
};

/**
 * createKafkaConnection
 * @param kafkaId
 * @param kafkaName
 * @param currentNamespace
 */
export const createKafkaConnection = async (
  kafkaId: string,
  kafkaName: string,
  currentNamespace: string,
) => {
  const kafkaConnection = {
    apiVersion: `${CloudServicesRequestModel.apiGroup}/${CloudServicesRequestModel.apiVersion}`,
    kind: KafkaConnectionModel.kind,
    metadata: {
      name: kafkaName,
      namespace: currentNamespace,
    },
    spec: {
      kafkaId,
      accessTokenSecretName: AccessTokenSecretName,
      credentials: {
        serviceAccountSecretName: ServiceAccountSecretName,
      },
    },
  };

  const createdConnection = await k8sCreate(KafkaConnectionModel, kafkaConnection);
  return k8sWaitForUpdate(
    KafkaConnectionModel,
    createdConnection,
    (resource) => {
      const condition = getFinishedCondition(resource);

      if (condition) {
        if (condition.status === 'True') {
          return true;
        }
        throw new Error(condition.message);
      }
      return false;
    },
    10000,
  );
};

/**
 * createKafkaConnection
 *
 * @param kafkaId
 * @param kafkaName
 * @param currentNamespace
 */
export const deleteKafkaConnection = async (kafkaName: string, currentNamespace: string) => {
  try {
    return k8sKillByName(KafkaConnectionModel, kafkaName, currentNamespace);
  } catch {
    // eslint-disable-next-line no-console
    console.log('rhoas: failed to delete kafka connection');
  }
  return Promise.resolve();
};

export const listOfCurrentKafkaConnectionsById = async (currentNamespace: string) => {
  const localArray = [];
  const kafkaConnections = await k8sGet(KafkaConnectionModel, null, currentNamespace);
  if (kafkaConnections) {
    const callback = (kafka) => {
      const { kafkaId } = kafka.spec;
      localArray.push(kafkaId);
    };
    kafkaConnections.items.map(callback);
    return localArray;
  }

  return Promise.resolve([]);
};
