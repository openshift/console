import * as React from 'react';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';
import { OverviewItem } from '@console/shared';
import { PodResourceSummary, PodDetailsList, menuActions } from '../pod';
import { PodModel } from '../../models';
import { ResourceOverviewDetails } from './resource-overview-details';
import { NetworkingOverview } from './networking-overview';
import { KebabAction } from '../utils';
import { PodsOverview } from './pods-overview';
import { PodKind } from '../../module/k8s';

const PodOverviewDetails: React.SFC<PodOverviewDetailsProps> = ({ item: { obj: pod } }) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <PodRingSet
          key={pod.metadata.uid}
          podData={{
            obj: pod,
            pods: [pod],
            current: undefined,
            previous: undefined,
            isRollingOut: true,
          }}
          obj={pod}
          resourceKind={PodModel}
          path=""
        />
      </div>
      <div className="resource-overview__summary">
        <PodResourceSummary pod={pod} />
      </div>
      <div className="resource-overview__details">
        <PodDetailsList pod={pod} />
      </div>
    </div>
  );
};

const PodResourcesTab: React.SFC<PodResourcesTabProps> = ({ item: { obj, routes, services } }) => (
  <div className="overview__sidebar-pane-body">
    <PodsOverview obj={obj} />
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

type PodOverviewItem = {
  obj: PodKind;
} & OverviewItem;

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
