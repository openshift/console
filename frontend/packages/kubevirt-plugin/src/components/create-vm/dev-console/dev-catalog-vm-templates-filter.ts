import { PartialObjectMetadata } from '@console/internal/module/k8s';
import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_VM, TEMPLATE_TYPE_LABEL } from '../../../constants';

// removes all Templates identified as VM templates
const filter = (items: CatalogItem<PartialObjectMetadata>[]) =>
  items.filter((item) => {
    const vmTemplateLabel = item.data?.metadata?.labels?.[TEMPLATE_TYPE_LABEL];
    return vmTemplateLabel !== TEMPLATE_TYPE_VM && vmTemplateLabel !== TEMPLATE_TYPE_BASE;
  });

export default filter;
