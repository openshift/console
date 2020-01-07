import { getName } from '@console/shared/src';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  getTemplatesOfLabelType,
  getTemplatesWithLabels,
} from '../../../../selectors/vm-template/advanced';
import {
  getFlavorLabel,
  getOsLabel,
  getWorkloadLabel,
} from '../../../../selectors/vm-template/combined-dependent';
import { TEMPLATE_TYPE_BASE } from '../../../../constants/vm';

type FindTemplateOptions = {
  userTemplateName?: string;
  workload?: string;
  flavor?: string;
  os?: string;
};

export const findTemplate = (
  templates: TemplateKind[],
  { userTemplateName, workload, flavor, os }: FindTemplateOptions,
): TemplateKind => {
  if (userTemplateName) {
    return templates.find((template) => getName(template) === userTemplateName);
  }
  return getTemplatesWithLabels(getTemplatesOfLabelType(templates, TEMPLATE_TYPE_BASE), [
    getOsLabel(os),
    getWorkloadLabel(workload),
    getFlavorLabel(flavor),
  ])[0];
};
