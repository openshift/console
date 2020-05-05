import * as React from 'react';
import { OverviewItem, PodRing } from '@console/shared';
import { DaemonSetModel } from '../../models';
import { ResourceSummary } from '../utils';
import { menuActions, DaemonSetDetailsList } from '../daemon-set';
import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';

const DaemonSetOverviewDetails: React.SFC<DaemonSetOverviewDetailsProps> = ({
  item: { obj, pods },
}) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <PodRing pods={pods} resourceKind={DaemonSetModel} obj={obj} enableScaling={false} />
    </div>
    <div className="resource-overview__summary">
      <ResourceSummary resource={obj} showPodSelector showNodeSelector showTolerations />
    </div>
    <div className="resource-overview__details">
      <DaemonSetDetailsList ds={obj} />
    </div>
  </div>
);

const tabs = [
  {
    name: 'Details',
    component: DaemonSetOverviewDetails,
  },
  {
    name: 'Resources',
    component: OverviewDetailsResourcesTab,
  },
];

export const DaemonSetOverview: React.SFC<DaemonSetOverviewProps> = ({ item }) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={DaemonSetModel}
    menuActions={menuActions}
    tabs={tabs}
  />
);

type DaemonSetOverviewDetailsProps = {
  item: OverviewItem;
};

type DaemonSetOverviewProps = {
  item: OverviewItem;
};
