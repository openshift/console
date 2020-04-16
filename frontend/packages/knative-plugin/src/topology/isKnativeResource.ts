import { K8sResourceKind } from '@console/internal/module/k8s';
import { Model } from '@console/topology/src/types';
import { TYPE_EVENT_SOURCE } from './const';
import { getTopologyResourceObject } from '@console/dev-console/src/components/topology';
import { DeploymentModel } from '@console/internal/models';

const KNATIVE_CONFIGURATION = 'serving.knative.dev/configuration';

export const isKnativeResource = (resource: K8sResourceKind, model: Model): boolean => {
  if (!model?.nodes?.length) {
    return false;
  }
  if (resource.kind !== DeploymentModel.kind) {
    return false;
  }

  const eventSources = model.nodes
    .filter((n) => n.type === TYPE_EVENT_SOURCE)
    .map((n) => getTopologyResourceObject(n.data));

  const isEventSourceKind = (uid: string): boolean =>
    uid && !!eventSources?.find((eventSource) => eventSource.metadata?.uid === uid);

  if (isEventSourceKind(resource.metadata?.ownerReferences?.[0].uid)) {
    return true;
  }

  return !!resource.metadata?.labels?.[KNATIVE_CONFIGURATION];
};
