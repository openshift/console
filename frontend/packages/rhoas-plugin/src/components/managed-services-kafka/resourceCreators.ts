import { k8sCreate, k8sGet, k8sPatch } from '@console/internal/module/k8s/resource';
import * as _ from 'lodash';
import {
  AccessTokenSecretName,
  ServiceAccountSecretName,
  ManagedServiceAccountCRName,
  ManagedServicesRequestCRName,
} from '../../const';

import {
  ManagedServicesRequestModel,
  ManagedServiceAccountRequest,
  ManagedKafkaConnectionModel,
} from '../../models/rhoas';

/**
 * Create service account for purpose of supplying connection credentials
 *
 * @param currentNamespace
 */
export const createManagedServiceAccount = async (currentNamespace: string) => {
  const serviceAcct = {
    apiVersion: `${ManagedServicesRequestModel.apiGroup}/${ManagedServicesRequestModel.apiVersion}`,
    kind: ManagedServiceAccountRequest.kind,
    metadata: {
      name: ManagedServiceAccountCRName,
      namespace: currentNamespace,
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
      serviceAccountName: `RHOASOperator-ServiceAccount-${currentNamespace}`,
      serviceAccountDescription:
        'Service account created by RHOASOperator to access managed services',
      serviceAccountSecretName: ServiceAccountSecretName,
      reset: false,
    },
  };

  await k8sCreate(ManagedServiceAccountRequest, serviceAcct);
};

/**
 * Create request to fetch all managed kafkas from upstream
 */
export const createManagedServicesRequest = async function (currentNamespace: string) {
  const mkRequest = {
    apiVersion: `${ManagedServicesRequestModel.apiGroup}/${ManagedServicesRequestModel.apiVersion}`,
    kind: ManagedServicesRequestModel.kind,
    metadata: {
      annotations: {
        refreshTime: new Date().toISOString()
      },
      name: ManagedServicesRequestCRName,
      namespace: currentNamespace,
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
    },
  };

  return await k8sCreate(ManagedServicesRequestModel, mkRequest);
};

/**
 * Create request to fetch all managed kafkas from upstream
 */
export const patchManagedServicesRequest = async function (request: any) {
  const path = '/metadata/annotations/refreshTime';
  console.log(request)
  return await k8sPatch(ManagedServicesRequestModel, request, [
    {
      path,
      op: "replace",
      value: new Date().toISOString(),
    },
  ]);
};

export const createManagedServicesRequestIfNeeded = async (currentNamespace) => {
  let currentRequest;
  try {
    currentRequest = await k8sGet(
      ManagedServicesRequestModel,
      ManagedServicesRequestCRName,
      currentNamespace,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("rhoas: ManagedServicesRequest already exist")
  }
  try {
    let createdRequest;
    if (currentRequest) {
      createdRequest = await patchManagedServicesRequest(currentRequest);
    } else {
      createdRequest = await createManagedServicesRequest(currentNamespace);
    }
    console.log(createdRequest);
  } catch (error) {
    return error;
  }
};

export const createServiceAccountIfNeeded = async (currentNamespace) => {
  let managedServiceAccount;
  try {
    managedServiceAccount = await k8sGet(
      ManagedServiceAccountRequest,
      ManagedServiceAccountCRName,
      currentNamespace,
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log("rhoas: ServiceAccount already exist")
  }
  if (!managedServiceAccount) {
    await createManagedServiceAccount(currentNamespace);
    return true;
  }
  return false;
};

/**
 * Create
 * @param kafkaId
 * @param kafkaName
 * @param currentNamespace
 */
export const createManagedKafkaConnection = async (
  kafkaId: string,
  kafkaName: string,
  currentNamespace: string,
) => {
  const kafkaConnection = {
    apiVersion: `${ManagedServicesRequestModel.apiGroup}/${ManagedServicesRequestModel.apiVersion}`,
    kind: ManagedKafkaConnectionModel.kind,
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

  await k8sCreate(ManagedKafkaConnectionModel, kafkaConnection);
};

export const listOfCurrentKafkaConnectionsById = async (currentNamespace: string) => {
  const localArray = [];
  const kafkaConnections = await k8sGet(ManagedKafkaConnectionModel, null, currentNamespace);
  if (kafkaConnections) {
    const callback = (kafka) => {
      const { kafkaId } = kafka.spec;
      localArray.push(kafkaId);
    };
    kafkaConnections.items.map(callback);
    return localArray;
  }
};
