import * as _ from 'lodash';
import { getName, getNamespace } from '@console/shared/src/selectors';
import { TemplateKind } from '@console/internal/module/k8s';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { iGetIn } from '../../utils/immutable';
import {
  CUSTOM_FLAVOR,
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_TYPE_LABEL,
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

  const name = vm.metadata.labels['vm.kubevirt.io/template'];
  const namespace = vm.metadata.labels['vm.kubevirt.io/template-namespace'];
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

  const flavors = {
    // always listed
    [CUSTOM_FLAVOR]: CUSTOM_FLAVOR,
  };

  if (vmTemplate) {
    // enforced by the vm
    const templateFlavors = getTemplateFlavors([vmTemplate]);
    templateFlavors.forEach((f) => (flavors[f] = _.capitalize(f)));
  }

  // if VM OS or Workload is set, add flavors of matching templates only. Otherwise list all flavors.
  const vmOS = getOperatingSystem(vm);
  const vmWorkload = getWorkloadProfile(vm);
  const matchingTemplates = getTemplates(templates, vmOS, vmWorkload, undefined);
  const templateFlavors = getTemplateFlavors(matchingTemplates);
  templateFlavors.forEach((f) => (flavors[f] = _.capitalize(f)));

  // Sort flavors
  const sortedFlavors = {};
  flavorSort(Object.keys(flavors)).forEach((k) => {
    sortedFlavors[k] = flavors[k];
  });

  return sortedFlavors;
};

export const getRelevantTemplates = (
  commonTemplates: TemplateKind[],
  os: string,
  workloadProfile: string,
  flavor: string,
) => {
  const relevantTemplates = (commonTemplates || []).filter(
    (template) =>
      iGetIn(template, ['metadata', 'labels', TEMPLATE_TYPE_LABEL]) === 'base' &&
      (!os || iGetIn(template, ['metadata', 'labels', `${TEMPLATE_OS_LABEL}/${os}`])) &&
      (!workloadProfile ||
        iGetIn(template, [
          'metadata',
          'labels',
          `${TEMPLATE_WORKLOAD_LABEL}/${workloadProfile}`,
        ])) &&
      (flavor === 'Custom' ||
        iGetIn(template, ['metadata', 'labels', `${TEMPLATE_FLAVOR_LABEL}/${flavor}`])),
  );
  return relevantTemplates;
};
