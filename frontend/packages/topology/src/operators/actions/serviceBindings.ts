import { Node } from '@patternfly/react-topology';
import { serviceBindingModal } from '@console/app/src/components/modals/service-binding';
import {
  K8sResourceCommon,
  k8sCreate,
  K8sResourceKind,
  modelFor,
  referenceFor,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import { ServiceBindingModel } from '../../models';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../components/const';

type ServiceBinding = K8sResourceCommon & {
  spec: {
    application: {
      group: string;
      version: string;
      resource: string;
      name: string;
    };
    services: {
      group: string;
      version: string;
      kind: string;
      name: string;
    }[];
    bindAsFiles?: boolean;
    detectBindingResources?: boolean;
  };
};

/**
 * Extract the first part of a kubernetes apiVersion.
 *
 * For example 'apps' for Deployments (kind: Deployment, apiVersion: apps/v1)
 * and 'core' for Pods (kind: Pod, apiVersion: v1)
 */
const getGroup = (resource: K8sResourceCommon): string =>
  resource.apiVersion.includes('/')
    ? resource.apiVersion.substring(0, resource.apiVersion.indexOf('/'))
    : 'core';

/**
 * Extract the second part of a kubernetes apiVersion.
 *
 * For example 'v1' for Deployments (kind: Deployment, apiVersion: apps/v1)
 * and Pods (kind: Pod, apiVersion: v1)
 */
const getVersion = (resource: K8sResourceCommon): string =>
  resource.apiVersion.includes('/')
    ? resource.apiVersion.substring(resource.apiVersion.indexOf('/') + 1)
    : resource.apiVersion;

/**
 * Extracts the resource plural based on the registered models.
 *
 * For example 'deployments', 'pods', etc.
 */
const getResourcePlural = (resource: K8sResourceCommon): string =>
  modelFor(referenceFor(resource)).plural;

export const createServiceBindingResource = (
  source: K8sResourceKind,
  target: K8sResourceKind,
  serviceBindingName: string,
): ServiceBinding => {
  return {
    apiVersion: apiVersionForModel(ServiceBindingModel),
    kind: ServiceBindingModel.kind,
    metadata: {
      name: serviceBindingName,
      namespace: source.metadata.namespace,
    },
    spec: {
      application: {
        group: getGroup(source),
        version: getVersion(source),
        resource: getResourcePlural(source),
        name: source.metadata.name,
      },
      services: [
        {
          group: getGroup(target),
          version: getVersion(target),
          kind: target.kind,
          name: target.metadata.name,
        },
      ],
      detectBindingResources: true,
    },
  };
};

export const createServiceBinding = (
  source: K8sResourceKind,
  target: K8sResourceKind,
  serviceBindingName: string,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }
  const serviceBinding = createServiceBindingResource(source, target, serviceBindingName);
  return k8sCreate(ServiceBindingModel, serviceBinding);
};

const createServiceBindingConnection = (source: Node, target: Node) => {
  const sourceResource = source.getData().resource || source.getData().resources?.obj;
  const targetResource = target.getData().resource || target.getData().resources?.obj;
  return serviceBindingModal({
    model: modelFor(referenceFor(sourceResource)),
    source: sourceResource,
    target: targetResource,
  }).then(() => null);
};

export const getCreateConnector = (createHints: string[], source: Node, target: Node) => {
  if (
    createHints &&
    createHints.includes('createServiceBinding') &&
    target.getType() === TYPE_OPERATOR_BACKED_SERVICE
  ) {
    return createServiceBindingConnection;
  }
  return null;
};
