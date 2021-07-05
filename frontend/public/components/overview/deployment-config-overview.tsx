import * as React from 'react';
import { useTranslation } from 'react-i18next';
import PodRingSet from '@console/dynamic-plugin-sdk/src/shared/components/pod/PodRingSet';
import { OverviewItem } from '@console/dynamic-plugin-sdk';
import { DeploymentConfigModel } from '../../models';
import { DeploymentConfigDetailsList, menuActions } from '../deployment-config';
import { KebabAction, LoadingInline, ResourceSummary, WorkloadPausedAlert } from '../utils';
import { OverviewDetailsResourcesTab } from './resource-overview-page';
import { ResourceOverviewDetails } from './resource-overview-details';

const DeploymentConfigOverviewDetails: React.SFC<DeploymentConfigOverviewDetailsProps> = ({
  item: { obj: dc },
}) => {
  const { t } = useTranslation();
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      {dc.spec.paused && <WorkloadPausedAlert obj={dc} model={DeploymentConfigModel} />}
      <div className="resource-overview__pod-counts">
        <PodRingSet key={dc.metadata.uid} obj={dc} path="/spec/replicas" />
      </div>
      <div className="resource-overview__summary">
        <ResourceSummary resource={dc} showPodSelector showNodeSelector showTolerations>
          <dt>{t('public~Status')}</dt>
          <dd>
            {dc.status.availableReplicas === dc.status.updatedReplicas ? (
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
        <DeploymentConfigDetailsList dc={dc} />
      </div>
    </div>
  );
};

export const DeploymentConfigOverviewPage: React.SFC<DeploymentConfigOverviewProps> = ({
  item,
  customActions,
}) => {
  const { t } = useTranslation();
  const tabs = [
    {
      name: t('public~Details'),
      component: DeploymentConfigOverviewDetails,
    },
    {
      name: t('public~Resources'),
      component: OverviewDetailsResourcesTab,
    },
  ];
  return (
    <ResourceOverviewDetails
      item={item}
      kindObj={DeploymentConfigModel}
      menuActions={customActions ? [...customActions, ...menuActions] : menuActions}
      tabs={tabs}
    />
  );
};

type DeploymentConfigOverviewDetailsProps = {
  item: OverviewItem;
};

type DeploymentConfigOverviewProps = {
  item: OverviewItem;
  customActions?: KebabAction[];
};
