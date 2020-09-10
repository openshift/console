import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  CUSTOM_FLAVOR,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import {
  getTemplateFlavors,
  getTemplatesWithLabels,
  getTemplateWorkloadProfiles,
} from './advanced';
import { isCustomFlavor } from '../vm-like/flavor';

const getLabel = (labelPrefix: string, value: string) => {
  if (!value) {
    return undefined;
  }
  return `${labelPrefix}/${_.get(value, 'id') || value}`;
};

export const getWorkloadLabel = (workload: string) => getLabel(TEMPLATE_WORKLOAD_LABEL, workload);
export const getOsLabel = (os: string) => getLabel(TEMPLATE_OS_LABEL, os);
export const getFlavorLabel = (flavor: string) => {
  if (!isCustomFlavor(flavor)) {
    return `${TEMPLATE_FLAVOR_LABEL}/${flavor}`;
  }
  return undefined;
};

export const getWorkloadProfiles = (
  templates: TemplateKind[],
  { flavor, os }: { flavor: string; os: string },
) => {
  const templatesWithLabels = getTemplatesWithLabels(templates, [
    getOsLabel(os),
    getFlavorLabel(flavor),
  ]);

  return getTemplateWorkloadProfiles(templatesWithLabels);
};

export const getFlavors = (
  templates: TemplateKind[],
  { workload, os }: { workload: string; os: string },
) => {
  const templatesWithLabels = getTemplatesWithLabels(templates, [
    getWorkloadLabel(workload),
    getOsLabel(os),
  ]);

  const flavors = getTemplateFlavors(templatesWithLabels).filter((f) => !isCustomFlavor(f));
  flavors.push(CUSTOM_FLAVOR);

  return flavors;
};
