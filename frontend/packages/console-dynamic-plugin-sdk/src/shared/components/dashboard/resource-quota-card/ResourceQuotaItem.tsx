import * as React from 'react';
import * as _ from 'lodash';
import {
  getQuotaResourceTypes,
  QuotaScopesInline,
  QuotaGaugeCharts,
} from '@console/internal/components/resource-quota';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ResourceQuotaModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';

import './resource-quota-card.scss';

const ResourceQuotaItem: React.FC<ResourceQuotaItemProps> = ({ resourceQuota }) => {
  const resourceTypes = getQuotaResourceTypes(resourceQuota);
  const scopes = _.get(resourceQuota, 'spec.scopes');
  return (
    <>
      <div>
        <ResourceLink
          kind={ResourceQuotaModel.kind}
          name={resourceQuota.metadata.name}
          className="co-resource-item--truncate co-resource-quota-card__item-title"
          namespace={resourceQuota.metadata.namespace}
          inline="true"
        />
        {scopes && (
          <QuotaScopesInline className="co-resource-quota-dashboard-scopes" scopes={scopes} />
        )}
      </div>
      <QuotaGaugeCharts
        quota={resourceQuota}
        resourceTypes={resourceTypes}
        chartClassName="co-resource-quota-card__chart"
      />
    </>
  );
};

export default ResourceQuotaItem;

type ResourceQuotaItemProps = {
  resourceQuota: K8sResourceKind;
};
