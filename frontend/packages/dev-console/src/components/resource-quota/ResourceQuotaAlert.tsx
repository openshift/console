import type { FC } from 'react';
import { useMemo } from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { useK8sWatchResources } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '@console/internal/models';
import type {
  AppliedClusterResourceQuotaKind,
  ResourceQuotaKind,
} from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { checkQuotaLimit } from '@console/topology/src/components/utils/checkResourceQuota';

export interface ResourceQuotaAlertProps {
  namespace: string;
}

export const ResourceQuotaAlert: FC<ResourceQuotaAlertProps> = ({ namespace }) => {
  const { t } = useTranslation('devconsole');
  const fireTelemetryEvent = useTelemetry();

  const watchedResources = useMemo(
    () => ({
      resourcequotas: {
        groupVersionKind: {
          kind: ResourceQuotaModel.kind,
          version: ResourceQuotaModel.apiVersion,
        },
        namespace,
        isList: true,
      },
      appliedclusterresourcequotas: {
        groupVersionKind: {
          kind: AppliedClusterResourceQuotaModel.kind,
          version: AppliedClusterResourceQuotaModel.apiVersion,
          group: AppliedClusterResourceQuotaModel.apiGroup,
        },
        namespace,
        isList: true,
      },
    }),
    [namespace],
  );

  const { resourcequotas, appliedclusterresourcequotas } = useK8sWatchResources<{
    resourcequotas: ResourceQuotaKind[];
    appliedclusterresourcequotas: AppliedClusterResourceQuotaKind[];
  }>(watchedResources);

  const [totalRQatQuota = [], quotaName, quotaKind] = useMemo(
    () =>
      resourcequotas.loaded && !resourcequotas.loadError
        ? checkQuotaLimit(resourcequotas.data)
        : [],
    [resourcequotas],
  );

  const [totalACRQatQuota = [], clusterRQName, clusterRQKind] = useMemo(
    () =>
      appliedclusterresourcequotas.loaded && !appliedclusterresourcequotas.loadError
        ? checkQuotaLimit(appliedclusterresourcequotas.data)
        : [],
    [appliedclusterresourcequotas],
  );

  const totalResourcesAtQuota = [...totalRQatQuota, ...totalACRQatQuota].filter(
    (resourceAtQuota) => resourceAtQuota !== 0,
  );

  const warningMessageFlag = totalResourcesAtQuota.length > 0;

  const resourceQuotaName = totalResourcesAtQuota.length === 1 ? quotaName || clusterRQName : null;
  const resourceQuotaKind = totalResourcesAtQuota.length === 1 ? quotaKind || clusterRQKind : null;

  const getRedirectLink = () => {
    if (resourceQuotaName && resourceQuotaKind === AppliedClusterResourceQuotaModel.kind) {
      return resourcePathFromModel(AppliedClusterResourceQuotaModel, resourceQuotaName, namespace);
    }
    if (resourceQuotaName) {
      return resourcePathFromModel(ResourceQuotaModel, resourceQuotaName, namespace);
    }
    return resourcePathFromModel(ResourceQuotaModel, null, namespace);
  };

  const onResourceQuotaLinkClick = () => {
    fireTelemetryEvent('Resource Quota Warning Label Clicked');
  };

  return (
    <>
      {warningMessageFlag && resourcequotas.loaded && appliedclusterresourcequotas.loaded ? (
        <Label status="warning" variant="outline">
          <Link
            to={getRedirectLink()}
            data-test="resource-quota-warning"
            onClick={onResourceQuotaLinkClick}
          >
            {t('{{count}} resource reached quota', {
              count: totalResourcesAtQuota.reduce((a, b) => a + b, 0),
            })}
          </Link>
        </Label>
      ) : null}
    </>
  );
};
