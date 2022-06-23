import * as React from 'react';
import { ExpandableSection, Split, SplitItem } from '@patternfly/react-core';
import ResourceQuotaCharts from '@console/app/src/components/resource-quota/ResourceQuotaCharts';
import { QuotaScopesInline } from '@console/internal/components/resource-quota';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { ResourceQuotaModel } from '@console/internal/models';
import { ResourceQuotaKind } from '@console/internal/module/k8s';
import QuotaSummary from './QuotaSummary';

const ResourceQuotaItem: React.FC<ResourceQuotaItemProps> = ({ resourceQuota }) => {
  const resources = Object.keys(resourceQuota.status?.hard ?? {});
  const [isExpanded, setExpanded] = React.useState(resources.length <= 4);

  const scopes = resourceQuota.spec?.scopes;
  return (
    <>
      <Split hasGutter>
        <SplitItem isFilled>
          <ExpandableSection
            onToggle={setExpanded}
            isExpanded={isExpanded}
            toggleContent={
              <ResourceLink
                groupVersionKind={{
                  kind: ResourceQuotaModel.kind,
                  version: ResourceQuotaModel.apiVersion,
                }}
                name={resourceQuota.metadata.name}
                namespace={resourceQuota.metadata.namespace}
                inline
                truncate
                dataTest="resource-quota-link"
              />
            }
          />
        </SplitItem>
        <SplitItem>
          <QuotaSummary hard={resourceQuota.status?.hard} used={resourceQuota.status?.used} />
        </SplitItem>
      </Split>
      {isExpanded && (
        <>
          {scopes && <QuotaScopesInline scopes={scopes} />}
          <ResourceQuotaCharts resourceQuota={resourceQuota} />
        </>
      )}
    </>
  );
};

export default ResourceQuotaItem;

type ResourceQuotaItemProps = {
  resourceQuota: ResourceQuotaKind;
};
