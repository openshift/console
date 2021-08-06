/**
 * @deprecated [TopologySideBar] There is no visualization a Pod resource on the topology/list view. this file contains unused code, delete this once all the side bars uses dynamic extensions
 */
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
import { useTranslation } from 'react-i18next';

const PodOverviewDetails: React.SFC<PodOverviewDetailsProps> = ({ item: { obj: pod } }) => {
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <PodRingSet key={pod.metadata.uid} obj={pod} path="" />
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

const PodResourcesTab: React.SFC<PodResourcesTabProps> = ({ item: { obj } }) => (
  <div className="overview__sidebar-pane-body">
    <PodsOverview obj={obj} />
    <NetworkingOverview obj={obj} />
  </div>
);

export const PodOverviewPage: React.SFC<PodOverviewPageProps> = ({ item, customActions }) => {
  const { t } = useTranslation();
  const tabs = [
    {
      name: t('public~Details'),
      component: PodOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: PodResourcesTab,
    },
  ];

  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={PodModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

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
