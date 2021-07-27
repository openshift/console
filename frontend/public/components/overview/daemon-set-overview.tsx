/**
 * @deprecated
 */
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { OverviewItem, PodRing, usePodsWatcher } from '@console/shared';
import { DaemonSetModel } from '../../models';
import { KebabAction, ResourceSummary, StatusBox } from '../utils';
import { menuActions, DaemonSetDetailsList } from '../daemon-set';
import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';

const DaemonSetOverviewDetails: React.SFC<DaemonSetOverviewDetailsProps> = ({ item: { obj } }) => {
  const { namespace } = obj.metadata;
  const { podData, loaded, loadError } = usePodsWatcher(obj, 'DaemonSet', namespace);

  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__pod-counts">
        <StatusBox loaded={loaded} data={podData} loadError={loadError}>
          <PodRing
            pods={podData?.pods ?? []}
            resourceKind={DaemonSetModel}
            obj={obj}
            enableScaling={false}
          />
        </StatusBox>
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} showPodSelector showNodeSelector showTolerations />
      </div>
      <div className="resource-overview__details">
        <DaemonSetDetailsList ds={obj} />
      </div>
    </div>
  );
};

export const DaemonSetOverview: React.SFC<DaemonSetOverviewProps> = ({ item, customActions }) => {
  const { t } = useTranslation();

  const tabs = [
    {
      name: t('public~Details'),
      component: DaemonSetOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: OverviewDetailsResourcesTab,
    },
  ];

  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={DaemonSetModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

type DaemonSetOverviewDetailsProps = {
  item: OverviewItem;
};

type DaemonSetOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
