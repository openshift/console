import * as React from 'react';
import { PodOverviewItem } from '.';
import { PodResourceSummary, PodDetailsList, menuActions } from '../pod';
import { PodModel } from '../../models';
import { ResourceOverviewDetails } from './resource-overview-details';
import { NetworkingOverview } from './networking-overview';
import { KebabAction } from '../utils';

const PodOverviewDetails: React.SFC<PodOverviewDetailsProps> = ({ item: { obj: pod } }) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <PodResourceSummary pod={pod} />
      </div>
      <div className="resource-overview__details">
        <PodDetailsList pod={pod} />
      </div>
    </div>
  );
};

const PodResourcesTab: React.SFC<PodResourcesTabProps> = ({ item: { routes, services } }) => (
  <div className="overview__sidebar-pane-body">
    <NetworkingOverview services={services} routes={routes} />
  </div>
);

const tabs = [
  {
    name: 'Details',
    component: PodOverviewDetails,
  },
  {
    name: 'Resources',
    component: PodResourcesTab,
  },
];

export const PodOverviewPage: React.SFC<PodOverviewPageProps> = ({ item, customActions }) => (
  <ResourceOverviewDetails
    item={item}
    kindObj={PodModel}
    menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
    tabs={tabs}
  />
);

type PodOverviewDetailsProps = {
  item: PodOverviewItem;
};

type PodResourcesTabProps = {
  item: PodOverviewItem;
};

type PodOverviewPageProps = {
  item: PodOverviewItem;
  customActions?: KebabAction[];
};
