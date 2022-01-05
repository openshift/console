import * as React from 'react';
import {
  getQuotaResourceTypes,
  QuotaScopesInline,
  QuotaGaugeCharts,
} from '@console/internal/components/resource-quota';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { AppliedClusterResourceQuotaModel } from '@console/internal/models';
import { referenceForModel, AppliedClusterResourceQuotaKind } from '@console/internal/module/k8s';

import './resource-quota-card.scss';

const AppliedClusterResourceQuotaItem: React.FC<AppliedClusterResourceQuotaItemProps> = ({
  resourceQuota,
  namespace,
}) => {
  const resourceTypes = getQuotaResourceTypes(resourceQuota);
  const scopes = resourceQuota?.spec?.quota?.scopes;
  return (
    <>
      <div>
        <ResourceLink
          kind={referenceForModel(AppliedClusterResourceQuotaModel)}
          name={resourceQuota.metadata.name}
          className="co-resource-item--truncate co-resource-quota-card__item-title"
          namespace={namespace}
          inline
        />
        {scopes && <QuotaScopesInline scopes={scopes} />}
      </div>
      <QuotaGaugeCharts
        quota={resourceQuota}
        resourceTypes={resourceTypes}
        namespace={namespace}
        chartClassName="co-resource-quota-card__chart"
      />
    </>
  );
};

export default AppliedClusterResourceQuotaItem;

type AppliedClusterResourceQuotaItemProps = {
  resourceQuota: AppliedClusterResourceQuotaKind;
  namespace: string;
};
