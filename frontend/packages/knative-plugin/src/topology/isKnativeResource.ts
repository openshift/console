import { Model } from '@patternfly/react-topology';
import { DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { OdcNodeModel } from '@console/topology/src/topology-types';
import { CAMEL_SOURCE_INTEGRATION } from '../const';
import { EventingBrokerModel } from '../models';
import { TYPE_EVENT_SINK, TYPE_EVENT_SOURCE, TYPE_EVENT_SOURCE_KAFKA } from './const';

const KNATIVE_CONFIGURATION = 'serving.knative.dev/configuration';

export const isKnativeResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  if (resource.kind !== DeploymentModel.kind) {
    return false;
  }

  const eventResources = model.nodes
    .filter(
      (n) =>
        n.type === TYPE_EVENT_SOURCE ||
        n.type === TYPE_EVENT_SOURCE_KAFKA ||
        n.type === TYPE_EVENT_SINK,
    )
    .map((n) => (n as OdcNodeModel).resource);

  const isEventSourceSinkKind = (uid: string): boolean =>
    uid &&
    !!eventResources?.find(
      (eventSource) =>
        eventSource.metadata?.uid === uid ||
        resource.metadata?.labels?.[CAMEL_SOURCE_INTEGRATION]?.startsWith(
          eventSource.metadata?.name,
        ),
    );

  if (isEventSourceSinkKind(resource.metadata?.ownerReferences?.[0].uid)) {
    return true;
  }

  if (resource.metadata?.ownerReferences?.[0].kind === EventingBrokerModel.kind) {
    return true;
  }

  return !!resource.metadata?.labels?.[KNATIVE_CONFIGURATION];
};
