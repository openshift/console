import * as _ from 'lodash';
import { k8sCreate, K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { Node } from '@patternfly/react-topology';
import { ServiceBindingRequestModel } from '../../../../models';

export const createServiceBinding = (
  source: K8sResourceKind,
  target: K8sResourceKind,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const targetName = _.get(target, 'metadata.name');
  const sourceName = _.get(source, 'metadata.name');
  const namespace = _.get(source, 'metadata.namespace');
  const sourceGroup = _.split(_.get(source, 'apiVersion'), '/');
  const targetResourceGroup = _.split(_.get(target, 'metadata.ownerReferences[0].apiVersion'), '/');
  const targetResourceKind = _.get(target, 'metadata.ownerReferences[0].kind');
  const targetResourceRefName = _.get(target, 'metadata.ownerReferences[0].name');
  const sbrName = `${sourceName}-${modelFor(referenceFor(source)).abbr}-${targetName}-${
    modelFor(target.kind).abbr
  }`;

  const serviceBindingRequest = {
    apiVersion: 'apps.openshift.io/v1alpha1',
    kind: 'ServiceBindingRequest',
    metadata: {
      name: sbrName,
      namespace,
    },
    spec: {
      applicationSelector: {
        resourceRef: sourceName,
        group: sourceGroup[0],
        version: sourceGroup[1],
        resource: modelFor(referenceFor(source)).plural,
      },
      backingServiceSelector: {
        group: targetResourceGroup[0],
        version: targetResourceGroup[1],
        kind: targetResourceKind,
        resourceRef: targetResourceRefName,
      },
      detectBindingResources: true,
    },
  };

  return k8sCreate(ServiceBindingRequestModel, serviceBindingRequest);
};

const createServiceBindingConnection = (source: Node, target: Node) => {
  return createServiceBinding(
    source.getData()?.resources?.obj,
    target.getData()?.resources?.obj,
  ).then(() => null);
};

export const getCreateConnector = (createHints: string[]) => {
  if (createHints && createHints.includes('createServiceBinding')) {
    return createServiceBindingConnection;
  }
  return null;
};
