import * as React from 'react';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { usePodsWatcher } from '../../hooks';
import { podStatus, resourceStatus } from '../../utils/ResourceStatus';

type ResourceStatusProps = {
  obj: K8sResourceKind;
};

export const ResourceStatusForPods: React.FC<ResourceStatusProps> = ({ obj }) => {
  const { podData, loaded, loadError } = usePodsWatcher(obj);
  if (loaded && !loadError) {
    return resourceStatus(obj, podData.current, podData.isRollingOut);
  }
  return null;
};

export const ResourceStatus: React.FC<ResourceStatusProps> = ({ obj }) => {
  if (obj.kind === 'Pod') {
    return podStatus(obj as PodKind);
  }
  return <ResourceStatusForPods obj={obj} />;
};
