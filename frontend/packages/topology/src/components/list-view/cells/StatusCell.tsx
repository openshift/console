import * as React from 'react';
import { DataListCell } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { resourceObjPath } from '@console/internal/components/utils';
import { DaemonSetModel } from '@console/internal/models';
import { K8sResourceKind, PodKind, podPhase } from '@console/internal/module/k8s';
import { usePodsWatcher, PodRCData } from '@console/shared';
import { getTopologyResourceObject } from '../../../utils/topology-utils';

import './StatusCell.scss';

type StatusCellResourceLinkProps = {
  desired: number;
  ready: number;
  resource: K8sResourceKind;
};

const StatusCellResourceLink: React.FC<StatusCellResourceLinkProps> = ({
  desired = 0,
  ready = 0,
  resource,
}) => {
  const { t } = useTranslation();
  const href = `${resourceObjPath(resource, resource.kind)}/pods`;
  return (
    <Link to={href}>
      {t('topology~{{ready, number}} of {{count, number}} Pod', { ready, count: desired })}
    </Link>
  );
};

interface StatusCellResourceStatus {
  obj: K8sResourceKind;
  podData: PodRCData;
}

const StatusCellResourceStatus: React.FC<StatusCellResourceStatus> = ({ obj, podData }) => {
  const { t } = useTranslation();
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
    return <Link to={href}>{t('topology~{{length}} Pods', { length: filteredPods.length })}</Link>;
  }

  return podData.isRollingOut ? (
    <span className="text-muted">{t('topology~Rollout in progress...')}</span>
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

const StatusCell: React.FC<StatusProps> = ({ item }) => {
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

export { StatusCell, StatusCellResourceStatus };
