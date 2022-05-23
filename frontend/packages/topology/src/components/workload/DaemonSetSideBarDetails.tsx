import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { DaemonSetDetailsList } from '@console/internal/components/daemon-set';
import { ResourceSummary, StatusBox } from '@console/internal/components/utils';
import { DaemonSetModel } from '@console/internal/models';
import { DaemonSetKind } from '@console/internal/module/k8s';
import { PodRing, usePodsWatcher } from '@console/shared';
import { getResource } from '../../utils';

type DaemonSetOverviewDetailsProps = {
  ds: DaemonSetKind;
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

export const useDaemonSetSideBarDetails: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  const resource = getResource<DaemonSetKind>(element);
  if (!resource || resource.kind !== DaemonSetModel.kind) {
    return [undefined, true, undefined];
  }
  const section = <DaemonSetSideBarDetails ds={resource} />;
  return [section, true, undefined];
};
