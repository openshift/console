import * as React from 'react';
import { FirehoseResult, isUpstream } from '@console/internal/components/utils';
import { NodeModel, TemplateModel } from '@console/internal/models';
import { K8sResourceCommon, K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { ResourceInventoryItem } from '@console/shared/src/components/dashboard/inventory-card/InventoryItem';
import { KUBEVIRT_OS_IMAGES_NS, OPENSHIFT_OS_IMAGES_NS } from '../../../constants';
import { VirtualMachineModel } from '../../../models';
import { VMKind } from '../../../types';
import { flattenTemplates } from '../../vm-templates/utils';

const getTemplates = (resources) => {
  const vmTemplates = resources?.vmTemplates as FirehoseResult<TemplateKind[]>;
  const vmCommonTemplates = resources?.vmCommonTemplates as FirehoseResult<TemplateKind[]>;
  const vms = resources?.vms as FirehoseResult<VMKind[]>;
  return flattenTemplates({ vmTemplates, vmCommonTemplates, vms }) || [];
};

export type ResourcesSectionProps = {
  resources?: {
    [key: string]: FirehoseResult | FirehoseResult<K8sResourceKind>;
  };
};

export const ResourcesSection: React.FC<ResourcesSectionProps> = ({ resources }) => {
  const templates = React.useMemo(() => getTemplates(resources), [resources]);

  const dataSourceNS = React.useMemo(
    () => (isUpstream() ? KUBEVIRT_OS_IMAGES_NS : OPENSHIFT_OS_IMAGES_NS),
    [],
  );

  return (
    <>
      <ResourceInventoryItem
        resources={resources?.vms?.data as K8sResourceCommon[]}
        kind={VirtualMachineModel}
        isLoading={resources?.vms?.loaded === false}
        error={!!resources?.vms?.loadError}
        dataTest="kv-inventory-card--vms"
      />
      <ResourceInventoryItem
        resources={templates as K8sResourceCommon[]}
        kind={TemplateModel}
        isLoading={resources?.vmCommonTemplates?.loaded === false}
        error={!!resources?.vmCommonTemplates?.loadError}
        dataTest="kv-inventory-card--vm-templates"
        basePath={`/k8s/ns/${dataSourceNS}/virtualmachinetemplates`}
      />
      <ResourceInventoryItem
        resources={resources?.nodes?.data as K8sResourceCommon[]}
        kind={NodeModel}
        isLoading={resources?.nodes?.loaded === false}
        error={!!resources?.nodes?.loadError}
        dataTest="kv-inventory-card--nodes"
      />
      <ResourceInventoryItem
        resources={resources?.nads?.data as K8sResourceCommon[]}
        kind={NetworkAttachmentDefinitionModel}
        title="Network"
        titlePlural="Networks"
        isLoading={resources?.nads?.loaded === false}
        error={!!resources?.nads?.loadError}
        dataTest="kv-inventory-card--nads"
      />
    </>
  );
};
