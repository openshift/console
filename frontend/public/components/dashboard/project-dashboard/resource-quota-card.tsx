import * as React from 'react';
import * as _ from 'lodash-es';
import { useTranslation } from 'react-i18next';

import DashboardCard from '@console/shared/src/components/dashboard/dashboard-card/DashboardCard';
import DashboardCardBody from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardBody';
import DashboardCardHeader from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardHeader';
import DashboardCardTitle from '@console/shared/src/components/dashboard/dashboard-card/DashboardCardTitle';
import ResourceQuotaBody from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaBody';
import ResourceQuotaItem from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaItem';
import { getQuotaResourceTypes, hasComputeResources } from '../../resource-quota';
import { FirehoseResult } from '../../utils';
import { ResourceQuotaModel } from '../../../models';
import { withDashboardResources, DashboardItemProps } from '../with-dashboard-resources';
import { ProjectDashboardContext } from './project-dashboard-context';

const getResourceQuota = (namespace: string) => ({
  kind: ResourceQuotaModel.kind,
  namespace,
  isList: true,
  prop: 'resourceQuotas',
});

export const ResourceQuotaCard = withDashboardResources(
  ({ watchK8sResource, stopWatchK8sResource, resources }: DashboardItemProps) => {
    const { obj } = React.useContext(ProjectDashboardContext);
    React.useEffect(() => {
      const resourceQuota = getResourceQuota(obj.metadata.name);
      watchK8sResource(resourceQuota);
      return () => stopWatchK8sResource(resourceQuota);
    }, [obj.metadata.name, watchK8sResource, stopWatchK8sResource]);

    const quotas = _.get(resources.resourceQuotas, 'data', []) as FirehoseResult['data'];
    const loaded = _.get(resources.resourceQuotas, 'loaded');
    const error = _.get(resources.resourceQuotas, 'loadError');
    const { t } = useTranslation();

    return (
      <DashboardCard data-test-id="resource-quotas-card">
        <DashboardCardHeader>
          <DashboardCardTitle>{t('public~Resource quotas')}</DashboardCardTitle>
        </DashboardCardHeader>
        <DashboardCardBody>
          <ResourceQuotaBody error={!!error} isLoading={!loaded}>
            {quotas
              .filter((rq) => hasComputeResources(getQuotaResourceTypes(rq)))
              .map((rq) => (
                <ResourceQuotaItem key={rq.metadata.uid} resourceQuota={rq} />
              ))}
          </ResourceQuotaBody>
        </DashboardCardBody>
      </DashboardCard>
    );
  },
);
