import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { observer } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useK8sWatchResource } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { StatusBox } from '@console/internal/components/utils';
import { AppliedClusterResourceQuotaModel, ResourceQuotaModel } from '../../../../../public/models';
import {
  AppliedClusterResourceQuotaKind,
  ResourceQuotaKind,
} from '../../../../../public/module/k8s';
import { ModelContext, ExtensibleModel } from '../../data-transforms/ModelContext';
import { TopologyViewType } from '../../topology-types';
import { checkQuotaLimit } from '../utils/checkResourceQuota';
import { DroppableTopologyComponent } from './DroppableTopologyComponent';

interface TopologyDataRendererProps {
  viewType: TopologyViewType;
}

const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = observer(
  function TopologyDataRenderer({ viewType }) {
    const { t } = useTranslation();
    const { namespace, model, loaded, loadError } = React.useContext<ExtensibleModel>(ModelContext);

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
    totalResourcesAtQuota = totalResourcesAtQuota.filter(
      (resourceAtQuota) => resourceAtQuota !== 0,
    );

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
          <Alert variant="warning" title={t('topology~Resource quota reached')} isInline>
            <Link to={getRedirectLink()}>
              {t('topology~{{count}} resource reached quota', {
                count: totalResourcesAtQuota.reduce((a, b) => a + b, 0),
              })}
            </Link>
          </Alert>
        ) : null}
        <StatusBox
          skeleton={
            viewType === TopologyViewType.list && (
              <div className="co-m-pane__body skeleton-overview">
                <div className="skeleton-overview--head" />
                <div className="skeleton-overview--tile" />
                <div className="skeleton-overview--tile" />
                <div className="skeleton-overview--tile" />
              </div>
            )
          }
          data={model}
          label={t('topology~Topology')}
          loaded={loaded}
          loadError={loadError}
        >
          <DroppableTopologyComponent viewType={viewType} model={model} namespace={namespace} />
        </StatusBox>
      </>
    );
  },
);

export default TopologyDataRenderer;
