import * as _ from 'lodash';
import { k8sCreate, K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { Node } from '@patternfly/react-topology';
import { apiVersionForModel } from '@console/kubevirt-plugin/integration-tests/tests/utils/selectors';
import { ServiceBindingModel } from '../../../../models';

export const createServiceBinding = (
  source: K8sResourceKind,
  target: K8sResourceKind,
): Promise<K8sResourceKind> => {
  if (!source || !target || source === target) {
    return Promise.reject();
  }

  const sourceModel = modelFor(referenceFor(source));
  const targetModel = modelFor(referenceFor(target));
  const targetName = target.metadata.name;
  const { namespace, name: sourceName } = source.metadata;
  const sourceGroup = _.split(source.apiVersion, '/');
  const targetGroup = _.split(target.apiVersion, '/');
  const sbrName = `${sourceName}-${sourceModel.abbr.toLowerCase()}-${targetName}-${targetModel.abbr.toLowerCase()}`;

  const serviceBinding = {
    apiVersion: apiVersionForModel(ServiceBindingModel),
    kind: ServiceBindingModel.kind,
    metadata: {
      name: sbrName,
      namespace,
    },
    spec: {
      application: {
        name: sourceName,
        group: sourceGroup[0],
        version: sourceGroup[1],
        resource: modelFor(referenceFor(source)).plural,
      },
      services: [
        {
          group: targetGroup[0],
          version: targetGroup[1],
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

  return createServiceBinding(sourceResource, targetResource).then(() => null);
};

export const getCreateConnector = (createHints: string[]) => {
  if (
    createHints &&
    createHints.includes('createServiceBinding') &&
    !createHints.includes('operator-workload')
  ) {
    return createServiceBindingConnection;
  }
  return null;
};
