import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '@console/internal/models';
import { AppliedClusterResourceQuotaKind, ResourceQuotaKind } from '@console/internal/module/k8s';
import { checkQuotaLimit } from '@console/topology/src/components/utils/checkResourceQuota';

export interface ResourceQuotaAlertProps {
  namespace: string;
}

export const ResourceQuotaAlert: React.FC<ResourceQuotaAlertProps> = ({ namespace }) => {
  const { t } = useTranslation();
  const [warningMessageFlag, setWarningMessageFlag] = React.useState<boolean>();
  const [resourceQuotaName, setResourceQuotaName] = React.useState<string>('');
  const [resourceQuotaKind, setResourceQuotaKind] = React.useState<string>('');

  const [quotas, rqLoaded] = useK8sWatchResource<ResourceQuotaKind[]>({
    groupVersionKind: {
      kind: ResourceQuotaModel.kind,
      version: ResourceQuotaModel.apiVersion,
    },
    namespace,
    isList: true,
  });

  const [clusterQuotas, acrqLoaded] = useK8sWatchResource<AppliedClusterResourceQuotaKind[]>({
    groupVersionKind: {
      kind: AppliedClusterResourceQuotaModel.kind,
      version: AppliedClusterResourceQuotaModel.apiVersion,
      group: AppliedClusterResourceQuotaModel.apiGroup,
    },
    namespace,
    isList: true,
  });

  const [totalRQatQuota, quotaName, quotaKind] = checkQuotaLimit(quotas);
  const [totalACRQatQuota, clusterRQName, clusterRQKind] = checkQuotaLimit(clusterQuotas);

  let totalResourcesAtQuota = [...totalRQatQuota, ...totalACRQatQuota];
  totalResourcesAtQuota = totalResourcesAtQuota.filter((resourceAtQuota) => resourceAtQuota !== 0);

  React.useEffect(() => {
    if (totalResourcesAtQuota.length === 1) {
      setResourceQuotaName(quotaName || clusterRQName);
      setResourceQuotaKind(quotaKind || clusterRQKind);
    } else {
      setResourceQuotaName('');
      setResourceQuotaKind('');
    }
    if (totalResourcesAtQuota.length > 0) {
      setWarningMessageFlag(true);
    } else {
      setWarningMessageFlag(false);
    }
  }, [clusterRQKind, clusterRQName, totalResourcesAtQuota, quotaKind, quotaName]);

  const getRedirectLink = () => {
    if (resourceQuotaName && resourceQuotaKind === AppliedClusterResourceQuotaModel.kind) {
      return `/k8s/ns/${namespace}/${AppliedClusterResourceQuotaModel.apiGroup}~${AppliedClusterResourceQuotaModel.apiVersion}~${AppliedClusterResourceQuotaModel.kind}/${resourceQuotaName}`;
    }
    if (resourceQuotaName) {
      return `/k8s/ns/${namespace}/${ResourceQuotaModel.plural}/${resourceQuotaName}`;
    }
    return `/k8s/ns/${namespace}/${ResourceQuotaModel.plural}`;
  };
  return (
    <>
      {warningMessageFlag && rqLoaded && acrqLoaded ? (
        <Alert variant="warning" title={t('devconsole~Resource quota reached')} isInline>
          <Link to={getRedirectLink()}>
            {t('devconsole~{{count}} resource reached quota', {
              count: totalResourcesAtQuota.reduce((a, b) => a + b, 0),
            })}
          </Link>
        </Alert>
      ) : null}
    </>
  );
};

export default ResourceQuotaAlert;
