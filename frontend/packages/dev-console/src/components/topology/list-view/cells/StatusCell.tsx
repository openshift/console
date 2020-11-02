import { Node } from '@patternfly/react-topology';
import * as React from 'react';
import { Link } from 'react-router-dom';
import { DataListCell } from '@patternfly/react-core';
import { usePodsWatcher, PodRCData } from '@console/shared';
import { resourceObjPath } from '@console/internal/components/utils';
import { K8sResourceKind, PodKind, podPhase } from '@console/internal/module/k8s';
import { DaemonSetModel } from '@console/internal/models';
import { getTopologyResourceObject } from '../../topology-utils';

import './StatusCell.scss';

type StatusCellResourceLinkProps = {
  desired: number;
  ready: number;
  resource: K8sResourceKind;
};

export const StatusCellResourceLink: React.FC<StatusCellResourceLinkProps> = ({
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

interface StatusCellResourceStatus {
  obj: K8sResourceKind;
  podData: PodRCData;
}

export const StatusCellResourceStatus: React.FC<StatusCellResourceStatus> = ({ obj, podData }) => {
  if (obj.kind === DaemonSetModel.kind) {
    return (
      <StatusCellResourceLink
        desired={obj?.status?.desiredNumberScheduled}
        ready={obj?.status?.currentNumberScheduled}
        resource={obj}
      />
    );
  }
  if (obj.spec?.replicas === undefined) {
    const href = `${resourceObjPath(obj, obj.kind)}/pods`;
    const filteredPods = podData.pods?.filter((p) => podPhase(p as PodKind) !== 'Completed') ?? [];
    if (!filteredPods.length) {
      return null;
    }
    return <Link to={href}>{filteredPods.length} pods</Link>;
  }

  return podData.isRollingOut ? (
    <span className="text-muted">Rollout in progress...</span>
  ) : (
    <StatusCellResourceLink
      desired={obj.spec.replicas}
      ready={obj.status.replicas}
      resource={podData.current ? podData.current.obj : obj}
    />
  );
};

type StatusProps = {
  item: Node;
};

export const StatusCell: React.FC<StatusProps> = ({ item }) => {
  const resource = getTopologyResourceObject(item.getData());
  const { podData, loaded, loadError } = usePodsWatcher(resource);

  return (
    <DataListCell id={`${item.getId()}_status`}>
      <div className="odc-topology-list-view__detail--status">
        {loaded && !loadError ? (
          <StatusCellResourceStatus obj={resource} podData={podData} />
        ) : null}
      </div>
    </DataListCell>
  );
};
