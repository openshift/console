import { k8sCreate, k8sGet } from '@console/internal/module/k8s/resource';
import { AccessTokenSecretName } from '../../const';
import {
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
    apiVersion: ManagedServicesRequestModel.apiGroup + '/' + ManagedServicesRequestModel.apiVersion,
    kind: ManagedServiceAccountRequest.kind,
    metadata: {
      name: ManagedServiceAccountCRName,
      namespace: currentNamespace,
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
      serviceAccountName: 'RHOASOperator-ServiceAccount-' + currentNamespace,
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
export const createManagedServicesRequest = async (currentNamespace: string) => {
  const mkRequest = {
    apiVersion: ManagedServicesRequestModel.apiGroup + '/' + ManagedServicesRequestModel.apiVersion,
    kind: ManagedServicesRequestModel.kind,
    metadata: {
      name: ManagedServicesRequestCRName,
      namespace: currentNamespace,
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
    },
  };

  await k8sCreate(ManagedServicesRequestModel, mkRequest);
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
    console.log('managed kafka doesnt exist');
  }
  if (!currentRequest) {
    return await createManagedServicesRequest(currentNamespace);
  }

  return currentRequest;
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
    console.log('managed service account doesnt exist');
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
    apiVersion: ManagedServicesRequestModel.apiGroup + '/' + ManagedServicesRequestModel.apiVersion,
    kind: ManagedKafkaConnectionModel.kind,
    metadata: {
      name: kafkaName,
      namespace: currentNamespace,
    },
    spec: {
      kafkaId: kafkaId,
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
    kafkaConnections.items.map((kafka) => {
      const kafkaId = kafka.spec.kafkaId;
      localArray.push(kafkaId);
    });
    return localArray;
  }
};
