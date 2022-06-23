import * as React from 'react';
import { ExpandableSection, Split, SplitItem } from '@patternfly/react-core';
import AppliedClusterResourceQuotaCharts from '@console/app/src/components/resource-quota/AppliedClusterResourceQuotaCharts';
import { QuotaScopesInline } from '@console/internal/components/resource-quota';
import { ResourceLink } from '@console/internal/components/utils/resource-link';
import { AppliedClusterResourceQuotaModel } from '@console/internal/models';
import { AppliedClusterResourceQuotaKind } from '@console/internal/module/k8s';
import QuotaSummary from './QuotaSummary';

const AppliedClusterResourceQuotaItem: React.FC<AppliedClusterResourceQuotaItemProps> = ({
  resourceQuota,
  namespace,
}) => {
  const resources = Object.keys(resourceQuota.status?.total?.hard ?? {});
  const [isExpanded, setExpanded] = React.useState(resources.length <= 4);
  const scopes = resourceQuota?.spec?.quota?.scopes;
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
                  kind: AppliedClusterResourceQuotaModel.kind,
                  version: AppliedClusterResourceQuotaModel.apiVersion,
                  group: AppliedClusterResourceQuotaModel.apiGroup,
                }}
                name={resourceQuota.metadata.name}
                namespace={namespace}
                inline
                truncate
              />
            }
          />
        </SplitItem>
        <SplitItem>
          <QuotaSummary
            hard={resourceQuota.status?.total?.hard}
            used={resourceQuota.status?.total?.used}
          />
        </SplitItem>
      </Split>
      {isExpanded && (
        <>
          {scopes && <QuotaScopesInline scopes={scopes} />}
          <AppliedClusterResourceQuotaCharts
            appliedClusterResourceQuota={resourceQuota}
            namespace={namespace}
          />
        </>
      )}
    </>
  );
};

export default AppliedClusterResourceQuotaItem;

type AppliedClusterResourceQuotaItemProps = {
  resourceQuota: AppliedClusterResourceQuotaKind;
  namespace: string;
};
