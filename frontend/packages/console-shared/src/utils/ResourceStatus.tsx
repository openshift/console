import * as React from 'react';
import { Link } from 'react-router-dom';
import { resourceObjPath } from '@console/internal/components/utils';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { PodStatus } from '@console/internal/components/pod';
import { PodControllerOverviewItem } from '../types';
import { DaemonSetModel } from '@console/internal/models';

export const resourceStatus = (
  obj: K8sResourceKind,
  current?: PodControllerOverviewItem,
  isRollingOut?: boolean,
) => {
  if (obj.kind === DaemonSetModel.kind) {
    return (
      <OverviewItemReadiness
        desired={obj?.status?.desiredNumberScheduled}
        ready={obj?.status?.currentNumberScheduled}
        resource={obj}
      />
    );
  }
  return isRollingOut ? (
    <span className="text-muted">Rollout in progress...</span>
  ) : (
    <OverviewItemReadiness
      desired={obj.spec.replicas}
      ready={obj.status.replicas}
      resource={current ? current.obj : obj}
    />
  );
};

export const podStatus = (obj: PodKind) => {
  return <PodStatus pod={obj} />;
};

type OverviewItemReadinessProps = {
  desired: number;
  resource: K8sResourceKind;
  ready: number;
};

export const OverviewItemReadiness: React.FC<OverviewItemReadinessProps> = ({
  desired = 0,
  ready = 0,
  resource,
}) => {
  const href = `${resourceObjPath(resource, resource.kind)}/pods`;
  return (
    <Link to={href}>
      {ready} of {desired} pods
    </Link>
  );
};
