import { CatalogItem } from '@console/dynamic-plugin-sdk';
import { PartialObjectMetadata } from '@console/internal/module/k8s';
import { TEMPLATE_TYPE_BASE, TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM } from '../../../constants';

// removes all Templates identified as VM templates
const filter = (item: CatalogItem<PartialObjectMetadata>): boolean => {
  const vmTemplateLabel = item.data?.metadata?.labels?.[TEMPLATE_TYPE_LABEL];
  return vmTemplateLabel !== TEMPLATE_TYPE_VM && vmTemplateLabel !== TEMPLATE_TYPE_BASE;
};

export default filter;
