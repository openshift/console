import * as _ from 'lodash';
import { getLabel, getName, getNamespace } from '@console/shared/src/selectors';
import { TemplateKind } from '@console/internal/module/k8s';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import {
  CUSTOM_FLAVOR,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants';
import { getLabels } from '../selectors';
import { getOperatingSystem, getWorkloadProfile } from '../vm/selectors';
import { flavorSort } from '../../utils/sort';
import { VMKind } from '../../types/vm';

export const getVMTemplateNamespacedName = (
  vm: VMGenericLikeEntityKind,
): { name: string; namespace: string } => {
  if (!vm || !vm.metadata || !vm.metadata.labels) {
    return null;
  }

  const name = getLabel(vm, LABEL_USED_TEMPLATE_NAME);
  const namespace = getLabel(vm, LABEL_USED_TEMPLATE_NAMESPACE);
  return name && namespace ? { name, namespace } : null;
};

const getVMTemplate = (vm: VMGenericLikeEntityKind, templates: TemplateKind[]): TemplateKind => {
  const namespacedName = getVMTemplateNamespacedName(vm);
  return namespacedName
    ? templates.find(
        (template) =>
          getName(template) === namespacedName.name &&
          getNamespace(template) === namespacedName.namespace,
      )
    : undefined;
};

export const getTemplatesLabelValues = (templates: TemplateKind[], label: string) => {
  const labelValues = [];
  (templates || []).forEach((t) => {
    const labels = Object.keys(getLabels(t, [])).filter((l) => l.startsWith(label));
    labels.forEach((l) => {
      const labelParts = l.split('/');
      if (labelParts.length > 1) {
        const labelName = labelParts[labelParts.length - 1];
        if (labelValues.indexOf(labelName) === -1) {
          labelValues.push(labelName);
        }
      }
    });
  });
  return labelValues;
};

export const getTemplateFlavors = (vmTemplates: TemplateKind[]) =>
  getTemplatesLabelValues(vmTemplates, TEMPLATE_FLAVOR_LABEL);
export const getTemplateOS = (vmTemplates: TemplateKind[]) =>
  getTemplatesLabelValues(vmTemplates, TEMPLATE_OS_LABEL);
export const getTemplateWorkloads = (vmTemplates: TemplateKind[]) =>
  getTemplatesLabelValues(vmTemplates, TEMPLATE_WORKLOAD_LABEL);

export const getTemplates = (
  templates: TemplateKind[] = [],
  os: string,
  workload: string,
  flavor: string,
) =>
  templates.filter((t) => {
    if (os) {
      const templateOS = getTemplateOS([t]);
      if (!templateOS.includes(os)) {
        return false;
      }
    }

    if (workload) {
      const templateWorkloads = getTemplateWorkloads([t]);
      if (!templateWorkloads.includes(workload)) {
        return false;
      }
    }

    if (flavor) {
      const templateFlavors = getTemplateFlavors([t]);
      if (!templateFlavors.includes(flavor)) {
        return false;
      }
    }

    return true;
  });

export const getTemplateForFlavor = (templates: TemplateKind[], vm: VMKind, flavor: string) => {
  const vmOS = getOperatingSystem(vm);
  const vmWorkload = getWorkloadProfile(vm);
  const matchingTemplates = getTemplates(templates, vmOS, vmWorkload, flavor);

  // Take first matching. If OS/Workloads changes in the future, there will be another patch sent
  return matchingTemplates.length > 0 ? matchingTemplates[0] : undefined;
};

export const getFlavors = (vm: VMGenericLikeEntityKind, templates: TemplateKind[]) => {
  const vmTemplate = getVMTemplate(vm, templates);

  const flavors = [CUSTOM_FLAVOR];

  if (vmTemplate) {
    // enforced by the vm
    const templateFlavors = getTemplateFlavors([vmTemplate]);
    flavors.push(...templateFlavors);
  }

  // if VM OS or Workload is set, add flavors of matching templates only. Otherwise list all flavors.
  const vmOS = getOperatingSystem(vm);
  const vmWorkload = getWorkloadProfile(vm);
  const matchingTemplates = getTemplates(templates, vmOS, vmWorkload, undefined);
  const templateFlavors = getTemplateFlavors(matchingTemplates);
  flavors.push(...templateFlavors);

  return _.uniq(flavorSort(flavors).filter((f) => f));
};
