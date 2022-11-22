import { Node } from '@patternfly/react-topology';
import { serviceBindingModal } from '@console/app/src/components/modals/service-binding';
import {
  groupVersionFor,
  k8sCreate,
  K8sResourceKind,
  modelFor,
  referenceFor,
  apiVersionForModel,
} from '@console/internal/module/k8s';
import { ServiceBindingModel } from '@console/service-binding-plugin/src/models';
import { TYPE_OPERATOR_BACKED_SERVICE } from '../components/const';

export const createServiceBinding = (
  source: K8sResourceKind,
  target: K8sResourceKind,
  serviceBindingName: string,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const targetName = target.metadata.name;
  const { namespace, name: sourceName } = source.metadata;
  const { group: sourceGroup, version: sourceVersion } = groupVersionFor(source.apiVersion);
  const { group: targetGroup, version: targetVersion } = groupVersionFor(target.apiVersion);

  const serviceBinding = {
    apiVersion: apiVersionForModel(ServiceBindingModel),
    kind: ServiceBindingModel.kind,
    metadata: {
      name: serviceBindingName,
      namespace,
    },
    spec: {
      application: {
        name: sourceName,
        group: sourceGroup,
        version: sourceVersion,
        resource: modelFor(referenceFor(source)).plural,
      },
      services: [
        {
          group: targetGroup,
          version: targetVersion,
          kind: target.kind,
          name: targetName,
        },
      ],
      detectBindingResources: true,
    },
  };

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
    createHints?.includes('createServiceBinding') &&
    target.getType() === TYPE_OPERATOR_BACKED_SERVICE
  ) {
    return createServiceBindingConnection;
  }
  return null;
};
