import * as React from 'react';
import { useTranslation } from 'react-i18next';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import ResourceQuotaBody from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaBody';
import ResourceQuotaItem from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaItem';
import AppliedClusterResourceQuotaItem from '@console/shared/src/components/dashboard/resource-quota-card/AppliedClusterResourceQuotaItem';
import { getQuotaResourceTypes, hasComputeResources } from '../../resource-quota';
import { FirehoseResult, FirehoseResource } from '../../utils';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '../../../models';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import { ProjectDashboardContext } from './project-dashboard-context';
import { referenceForModel } from '../../../module/k8s';

const getResourceQuota = (namespace: string) => ({
  kind: ResourceQuotaModel.kind,
  namespace,
  isList: true,
  prop: 'resourceQuotas',
});

const getAppliedClusterResourceQuota = (namespace: string): FirehoseResource => ({
  kind: referenceForModel(AppliedClusterResourceQuotaModel),
  namespace,
  isList: true,
  prop: 'appliedClusterResourceQuotas',
});

export const ResourceQuotaCard = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }: DashboardItemProps) => {
    const { obj } = React.useContext(ProjectDashboardContext);
    React.useEffect(() => {
      const resourceQuota = getResourceQuota(obj.metadata.name);
      watchK8sResource(resourceQuota);
      return () => stopWatchK8sResource(resourceQuota);
    }, [obj.metadata.name, watchK8sResource, stopWatchK8sResource]);
    React.useEffect(() => {
      const appliedClusterResourceQuota = getAppliedClusterResourceQuota(obj.metadata.name);
      watchK8sResource(appliedClusterResourceQuota);
      return () => stopWatchK8sResource(appliedClusterResourceQuota);
    }, [obj.metadata.name, watchK8sResource, stopWatchK8sResource]);

    const quotas = (resources.resourceQuotas?.data || []) as FirehoseResult['data'];
    const clusterQuotas = (resources.appliedClusterResourceQuotas?.data ||
      []) as FirehoseResult['data'];
    const { loaded: rqLoaded, loadError: rqLoadError } = resources.resourceQuotas ?? {};
    const { loaded: acrqLoaded, loadError: acrqLoadError } =
      resources.appliedClusterResourceQuotas ?? {};

    const { t } = useTranslation();

    return (
      <DashboardCard data-test-id="resource-quotas-card">
        <DashboardCardHeader>
          <DashboardCardTitle>{t('public~ResourceQuotas')}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody>
          <ResourceQuotaBody error={!!rqLoadError} isLoading={!rqLoaded}>
            {quotas
              .filter((rq) => hasComputeResources(getQuotaResourceTypes(rq)))
              .map((rq) => (
                <ResourceQuotaItem key={rq.metadata.uid} resourceQuota={rq} />
              ))}
          </ResourceQuotaBody>
          <ResourceQuotaBody
            error={!!acrqLoadError}
            isLoading={!acrqLoaded}
            noText={t('public~No AppliedClusterResourceQuotas')}
          >
            {clusterQuotas
              .filter((rq) => hasComputeResources(getQuotaResourceTypes(rq)))
              .map((rq) => (
                <AppliedClusterResourceQuotaItem
                  key={rq.metadata.uid}
                  resourceQuota={rq}
                  namespace={obj.metadata.name}
                />
              ))}
          </ResourceQuotaBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);
