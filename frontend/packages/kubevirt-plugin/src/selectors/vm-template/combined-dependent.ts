import * as _ from 'lodash';
import { getName } from '@console/shared';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  CUSTOM_FLAVOR,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';
import {
  getTemplatesOfLabelType,
  getTemplateFlavors,
  getTemplateOperatingSystems,
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

export const getOperatingSystems = (
  templates: TemplateKind[],
  { workload, flavor, userTemplate }: { workload: string; flavor: string; userTemplate: string },
) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_VM).find((t) => getName(t) === userTemplate),
    ];
  } else {
    templatesWithLabels = getTemplatesWithLabels(
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_BASE),
      [getWorkloadLabel(workload), getFlavorLabel(flavor)],
    );
  }
  return getTemplateOperatingSystems(templatesWithLabels);
};

export const getWorkloadProfiles = (
  templates: TemplateKind[],
  { flavor, os, userTemplate }: { flavor: string; os: string; userTemplate: string },
) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_VM).find((t) => getName(t) === userTemplate),
    ];
  } else {
    templatesWithLabels = getTemplatesWithLabels(
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_BASE),
      [getOsLabel(os), getFlavorLabel(flavor)],
    );
  }
  return getTemplateWorkloadProfiles(templatesWithLabels);
};

export const getFlavors = (
  templates: TemplateKind[],
  { workload, os, userTemplate }: { workload: string; os: string; userTemplate: string },
) => {
  let templatesWithLabels;
  if (userTemplate) {
    templatesWithLabels = [
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_VM).find((t) => getName(t) === userTemplate),
    ];
  } else {
    templatesWithLabels = getTemplatesWithLabels(
      getTemplatesOfLabelType(templates, TEMPLATE_TYPE_BASE),
      [getWorkloadLabel(workload), getOsLabel(os)],
    );
  }
  const flavors = getTemplateFlavors(templatesWithLabels).filter((f) => !isCustomFlavor(f));
  flavors.push(CUSTOM_FLAVOR);

  return flavors;
};
