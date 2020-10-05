import * as React from 'react';
import { OverviewItem, usePodsWatcher } from '@console/shared';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { KebabAction, ResourceSummary, StatusBox } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';

const StatefulSetOverviewDetails: React.SFC<StatefulSetOverviewDetailsProps> = ({ item }) => {
  const { obj: ss } = item;
  const { podData, loaded, loadError } = usePodsWatcher(ss, 'StatefulSet', ss.metadata.namespace);

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRingSet
            key={ss.metadata.uid}
            podData={podData}
            obj={ss}
            resourceKind={StatefulSetModel}
            path="/spec/replicas"
          />
        </StatusBox>
      </div>
      <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
    </div>
  );
};

const tabs = [
  {
    name: 'Details',
    component: StatefulSetOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const StatefulSetOverview: React.SFC<StatefulSetOverviewProps> = ({
  item,
  customActions,
}) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={StatefulSetModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type StatefulSetOverviewDetailsProps = {
  item: OverviewItem;
};

type StatefulSetOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
