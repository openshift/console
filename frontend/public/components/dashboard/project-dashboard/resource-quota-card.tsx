import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle, Stack, StackItem } from '@patternfly/react-core';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import ResourceQuotaBody from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaBody';
import ResourceQuotaItem from '@console/shared/src/components/dashboard/resource-quota-card/ResourceQuotaItem';
import AppliedClusterResourceQuotaItem from '@console/shared/src/components/dashboard/resource-quota-card/AppliedClusterResourceQuotaItem';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '../../../models';
import { ProjectDashboardContext } from './project-dashboard-context';
import { ResourceQuotaKind, AppliedClusterResourceQuotaKind } from '../../../module/k8s';

export const ResourceQuotaCard = () => {
  const { obj } = React.useContext(ProjectDashboardContext);

  const [quotas, rqLoaded, rqLoadError] = useK8sWatchResource<ResourceQuotaKind[]>({
    groupVersionKind: {
      kind: ResourceQuotaModel.kind,
      version: ResourceQuotaModel.apiVersion,
    },
    namespace: obj.metadata.name,
    isList: true,
  });

  const [clusterQuotas, acrqLoaded, acrqLoadError] = useK8sWatchResource<
    AppliedClusterResourceQuotaKind[]
  >({
    groupVersionKind: {
      kind: AppliedClusterResourceQuotaModel.kind,
      version: AppliedClusterResourceQuotaModel.apiVersion,
      group: AppliedClusterResourceQuotaModel.apiGroup,
    },
    namespace: obj.metadata.name,
    isList: true,
  });

  const { t } = useTranslation();

  return (
    <Card data-test-id="resource-quotas-card">
      <CardHeader>
        <CardTitle>{t('public~ResourceQuotas')}</CardTitle>
      </CardHeader>
      <CardBody>
        <ResourceQuotaBody error={!!rqLoadError} isLoading={!rqLoaded}>
          {quotas.length ? (
            <Stack hasGutter>
              {quotas.map((rq) => (
                <StackItem key={rq.metadata.uid}>
                  <ResourceQuotaItem resourceQuota={rq} />
                </StackItem>
              ))}
            </Stack>
          ) : undefined}
        </ResourceQuotaBody>
      </CardBody>
      <CardHeader>
        <CardTitle>{t('public~AppliedClusterResourceQuotas')}</CardTitle>
      </CardHeader>
      <CardBody>
        <ResourceQuotaBody
          error={!!acrqLoadError}
          isLoading={!acrqLoaded}
          noText={t('public~No AppliedClusterResourceQuotas')}
        >
          {clusterQuotas.length ? (
            <Stack hasGutter>
              {clusterQuotas.map((cq) => (
                <StackItem key={cq.metadata.uid}>
                  <AppliedClusterResourceQuotaItem
                    resourceQuota={cq}
                    namespace={obj.metadata.name}
                  />
                </StackItem>
              ))}
            </Stack>
          ) : undefined}
        </ResourceQuotaBody>
      </CardBody>
    </Card>
  );
};
