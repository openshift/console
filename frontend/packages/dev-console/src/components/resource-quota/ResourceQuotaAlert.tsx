import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  useK8sWatchResources,
  YellowExclamationTriangleIcon,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { resourcePathFromModel } from '@console/internal/components/utils/resource-link';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '@console/internal/models';
import { AppliedClusterResourceQuotaKind, ResourceQuotaKind } from '@console/internal/module/k8s';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { checkQuotaLimit } from '@console/topology/src/components/utils/checkResourceQuota';

export interface ResourceQuotaAlertProps {
  namespace: string;
}

export const ResourceQuotaAlert: React.FC<ResourceQuotaAlertProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [warningMessageFlag, setWarningMessageFlag] = React.useState<boolean>();
  const [resourceQuotaName, setResourceQuotaName] = React.useState(null);
  const [resourceQuotaKind, setResourceQuotaKind] = React.useState(null);

  const watchedResources = React.useMemo(
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

  const [totalRQatQuota = [], quotaName, quotaKind] = React.useMemo(
    () =>
      resourcequotas.loaded && !resourcequotas.loadError
        ? checkQuotaLimit(resourcequotas.data)
        : [],
    [resourcequotas],
  );

  const [totalACRQatQuota = [], clusterRQName, clusterRQKind] = React.useMemo(
    () =>
      appliedclusterresourcequotas.loaded && !appliedclusterresourcequotas.loadError
        ? checkQuotaLimit(appliedclusterresourcequotas.data)
        : [],
    [appliedclusterresourcequotas],
  );

  let totalResourcesAtQuota = React.useMemo(() => [...totalRQatQuota, ...totalACRQatQuota], [
    totalRQatQuota,
    totalACRQatQuota,
  ]);
  totalResourcesAtQuota = totalResourcesAtQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);

  React.useEffect(() => {
    if (totalResourcesAtQuota.length === 1) {
      setResourceQuotaName(quotaName || clusterRQName);
      setResourceQuotaKind(quotaKind || clusterRQKind);
    } else {
      setResourceQuotaName(null);
      setResourceQuotaKind(null);
    }
  }, [clusterRQKind, clusterRQName, totalResourcesAtQuota, quotaKind, quotaName]);

  React.useEffect(() => {
    if (totalResourcesAtQuota.length > 0) {
      setWarningMessageFlag(true);
    } else {
      setWarningMessageFlag(false);
    }
  }, [totalResourcesAtQuota]);

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
        <Label color="orange" icon={<YellowExclamationTriangleIcon />}>
          <Link
            to={getRedirectLink()}
            data-test="resource-quota-warning"
            onClick={onResourceQuotaLinkClick}
          >
            {t('devconsole~{{count}} resource reached quota', {
              count: totalResourcesAtQuota.reduce((a, b) => a + b, 0),
            })}
          </Link>
        </Label>
      ) : null}
    </>
  );
};

export default ResourceQuotaAlert;
