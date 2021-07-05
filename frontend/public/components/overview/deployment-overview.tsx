import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { DeploymentModel } from '../../models';
import { DeploymentKind } from '../../module/k8s';
import { DeploymentDetailsList, menuActions } from '../deployment';
import { KebabAction, LoadingInline, ResourceSummary, WorkloadPausedAlert } from '../utils';

import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';
import PodRingSet from '@console/dynamic-plugin-sdk/src/shared/components/pod/PodRingSet';
import { OverviewItem } from '@console/dynamic-plugin-sdk';

const DeploymentOverviewDetails: React.SFC<DeploymentOverviewDetailsProps> = ({
  item: { obj: d },
}) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {d.spec.paused && <WorkloadPausedAlert obj={d} model={DeploymentModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={d.metadata.uid} obj={d} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={d} showPodSelector showNodeSelector showTolerations>
          <dt>{t('public~Status')}</dt>
          <dd>
            {d.status.availableReplicas === d.status.updatedReplicas ? (
              t('public~Active')
            ) : (
              <div>
                <span className="co-icon-space-r">
                  <LoadingInline />
                </span>{' '}
                {t('public~Updating')}
              </div>
            )}
          </dd>
        </ResourceSummary>
      </div>
      <div className="resource-overview__details">
        <DeploymentDetailsList deployment={d} />
      </div>
    </div>
  );
};

export const DeploymentOverviewPage: React.SFC<DeploymentOverviewProps> = ({
  item,
  customActions,
}) => {
  const { t } = useTranslation();

  const tabs = [
    {
      name: t('public~Details'),
      component: DeploymentOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: OverviewDetailsResourcesTab,
    },
  ];

  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={DeploymentModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

type DeploymentOverviewDetailsProps = {
  item: OverviewItem<DeploymentKind>;
};

type DeploymentOverviewProps = {
  item: OverviewItem<DeploymentKind>;
  customActions?: KebabAction[];
};
