import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DaemonSetDetailsList } from '@console/internal/components/daemon-set';
import { ResourceSummary, StatusBox } from '@console/internal/components/utils';
import { DaemonSetModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { PodRing, usePodsWatcher } from '@console/shared';
import { getResource } from '../../utils';

type DaemonSetOverviewDetailsProps = {
  ds: K8sResourceKind;
};

const DaemonSetSideBarDetails: React.FC<DaemonSetOverviewDetailsProps> = ({ ds }) => {
  const { namespace } = ds.metadata;
  const { podData, loaded, loadError } = usePodsWatcher(ds, 'DaemonSet', namespace);

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRing
            pods={podData?.pods ?? []}
            resourceKind={DaemonSetModel}
            obj={ds}
            enableScaling={false}
          />
        </StatusBox>
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={ds} showPodSelector showNodeSelector showTolerations />
      </div>
      <div className="resource-overview__details">
        <DaemonSetDetailsList ds={ds} />
      </div>
    </div>
  );
};

export const getDaemonSetSideBarDetails = (element: GraphElement) => {
  const resource = getResource(element);
  if (resource.kind !== DaemonSetModel.kind) return undefined;
  return <DaemonSetSideBarDetails ds={resource} />;
};
