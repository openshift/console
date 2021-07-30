/**
 * @deprecated [TopologySideBar] This files has been moved to @console/topology and delete this once all the side panels uses dynamic extensions
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { StatefulSetModel } from '../../models';
import { menuActions } from '../stateful-set';
import { KebabAction, ResourceSummary } from '../utils';
import PodRingSet from '@console/shared/src/components/pod/PodRingSet';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import { OverviewItem } from '@console/shared';

const StatefulSetOverviewDetails: React.SFC<StatefulSetOverviewDetailsProps> = ({
  item: { obj: ss },
}) => (
  <div className="overview__sidebar-pane-body resource-overview__body">
    <div className="resource-overview__pod-counts">
      <PodRingSet key={ss.metadata.uid} obj={ss} path="/spec/replicas" />
    </div>
    <ResourceSummary resource={ss} showPodSelector showNodeSelector showTolerations />
  </div>
);

export const StatefulSetOverview: React.SFC<StatefulSetOverviewProps> = ({
  item,
  customActions,
}) => {
  const { t } = useTranslation();
  const tabs = [
    {
      name: t('public~Details'),
      component: StatefulSetOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: OverviewDetailsResourcesTab,
    },
  ];

  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={StatefulSetModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

type StatefulSetOverviewDetailsProps = {
  item: OverviewItem;
};

type StatefulSetOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
