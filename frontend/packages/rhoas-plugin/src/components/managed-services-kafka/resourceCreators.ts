import { ManagedKafkaRequestModel, ManagedServiceAccountRequest, ManagedKafkaConnectionModel } from '../../models/rhoas';
import { k8sCreate, k8sGet } from '@console/internal/module/k8s/resource';
import { AccessTokenSecretName } from '../../const'
import { ServiceAccountSecretName, ManagedServiceAccountCRName, ManagedKafkaRequestCRName } from '../../const';

/**
 * Create service account for purpose of supplying connection credentials
 *
 * @param currentNamespace
 */
export const createManagedServiceAccount = async (currentNamespace: string) => {
  const serviceAcct = {
    apiVersion: ManagedKafkaRequestModel.apiGroup + "/" + ManagedKafkaRequestModel.apiVersion,
    kind: ManagedServiceAccountRequest.kind,
    metadata: {
      name: ManagedServiceAccountCRName,
      namespace: currentNamespace
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
      serviceAccountName: "RHOASOperator-ServiceAccount-" + currentNamespace,
      serviceAccountDescription: "Service account created by RHOASOperator to access managed services",
      serviceAccountSecretName: ServiceAccountSecretName,
      reset: false,
    }
  }

  await k8sCreate(ManagedServiceAccountRequest, serviceAcct);
};


/**
 * Create request to fetch all managed kafkas from upstream
 */
export const createManagedKafkaRequest = async (currentNamespace: string) => {
  const mkRequest = {
    apiVersion: ManagedKafkaRequestModel.apiGroup + "/" + ManagedKafkaRequestModel.apiVersion,
    kind: ManagedKafkaRequestModel.kind,
    metadata: {
      name: ManagedKafkaRequestCRName,
      namespace: currentNamespace
    },
    spec: {
      accessTokenSecretName: AccessTokenSecretName,
    }
  };

  await k8sCreate(ManagedKafkaRequestModel, mkRequest);
}

export const createManagedKafkaRequestIfNeeded = async (currentNamespace) => {
  let currentRequest
  try {
    currentRequest = await k8sGet(ManagedKafkaRequestModel, ManagedKafkaRequestCRName, currentNamespace);
  } catch (error) {
    console.log('managed kafka doesnt exist')
  }
  if (!currentRequest) {
    return await createManagedKafkaRequest(currentNamespace);
  }

  return currentRequest;
}

export const createServiceAccountIfNeeded = async (currentNamespace) => {
  let managedServiceAccount;
  try {
    managedServiceAccount = await k8sGet(ManagedServiceAccountRequest, ManagedServiceAccountCRName, currentNamespace);
  } catch (error) {
    console.log('managed service account doesnt exist')
  }
  if (!managedServiceAccount) {
    await createManagedServiceAccount(currentNamespace);
    return true
  }
  return false;
}

/**
 * Create
 * @param kafkaId
 * @param kafkaName
 * @param currentNamespace
 */
export const createManagedKafkaConnection = async (kafkaId: string, kafkaName: string, currentNamespace: string) => {
  const kafkaConnection = {
    apiVersion: ManagedKafkaRequestModel.apiGroup + "/" + ManagedKafkaRequestModel.apiVersion,
    kind: ManagedKafkaConnectionModel.kind,
    metadata: {
      name: kafkaName,
      namespace: currentNamespace
    },
    spec: {
      kafkaId: kafkaId,
      accessTokenSecretName: AccessTokenSecretName,
      credentials: {
        serviceAccountSecretName: ServiceAccountSecretName
      }
    }
  }

  await k8sCreate(ManagedKafkaConnectionModel, kafkaConnection);
};

export const listOfCurrentKafkaConnectionsById = async (currentNamespace: string) => {
  const localArray = [];
  const kafkaConnections = await k8sGet(ManagedKafkaConnectionModel, null, currentNamespace);
  if (kafkaConnections) {
    kafkaConnections.items.map((kafka) => {
      const kafkaId = kafka.spec.kafkaId;
      localArray.push(kafkaId);
    })
    return localArray;
  }
}


