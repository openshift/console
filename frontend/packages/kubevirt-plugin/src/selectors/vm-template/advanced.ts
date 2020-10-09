import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { getLabel } from '@console/shared';
import {
  CloudInitDataHelper,
  CloudInitDataFormKeys,
} from '../../k8s/wrapper/vm/cloud-init-data-helper';
import { getAnnotation, getAnnotations, getLabels, getParameterValue } from '../selectors';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  TEMPLATE_WORKLOAD_LABEL,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_VERSION_LABEL,
} from '../../constants/vm';
import { getCloudInitVolume, getDataVolumeTemplates, getDisks, getMemory } from '../vm/selectors';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { compareVersions, removeOSDups } from '../../utils/sort';
import { selectVM, isCommonTemplate } from './basic';
import {
  convertToBaseValue,
  pluralize,
  humanizeBinaryBytes,
} from '@console/internal/components/utils';
import { isTemplateSourceError, TemplateSourceStatus } from '../../statuses/template/types';

export const getTemplatesWithLabels = (templates: TemplateKind[], labels: string[]) => {
  const requiredLabels = labels.filter((label) => label);
  return templates.filter((template) => {
    const templateLabels = new Set(Object.keys(getLabels(template, {})));
    const missingLabel = requiredLabels.find((requiredLabel) => !templateLabels.has(requiredLabel));
    return !missingLabel;
  });
};

export const getTemplatesOfLabelType = (templates: TemplateKind[], type: string) =>
  (templates || []).filter(
    (template) => _.get(template, ['metadata', 'labels', TEMPLATE_TYPE_LABEL]) === type,
  );

export const getUserTemplate = (templates: TemplateKind[], userTemplateName: string) => {
  const userTemplates = getTemplatesOfLabelType(templates, TEMPLATE_TYPE_VM);
  return userTemplates.find((template) => template.metadata.name === userTemplateName);
};

export const getTemplatesLabelValues = (templates: TemplateKind[], label: string): string[] => {
  const labelValues = [];
  (templates || []).forEach((template) => {
    const labels = Object.keys(getLabels(template, {})).filter((l) => l.startsWith(label));
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

export const getTemplateFlavors = (templates: TemplateKind[]) =>
  getTemplatesLabelValues(templates, TEMPLATE_FLAVOR_LABEL);

export const getTemplateHostname = (template: TemplateKind) => {
  const vm = selectVM(template);
  const YAMLHostname = _.get(vm, 'spec.template.spec') && vm.spec.template.spec.hostname;
  if (YAMLHostname) {
    return YAMLHostname;
  }

  const cloudInitVolume = getCloudInitVolume(vm);
  const data = new VolumeWrapper(cloudInitVolume).getCloudInitNoCloud();
  const cloudInitHelper = new CloudInitDataHelper(data);
  return cloudInitHelper.get(CloudInitDataFormKeys.HOSTNAME);
};

export const getTemplateOperatingSystems = (templates: TemplateKind[]) => {
  const osIds = getTemplatesLabelValues(templates, TEMPLATE_OS_LABEL);
  const sortedTemplates = [...templates].sort((a, b) => {
    const aVersion = getLabel(a, TEMPLATE_VERSION_LABEL);
    const bVersion = getLabel(b, TEMPLATE_VERSION_LABEL);

    return -1 * compareVersions(aVersion, bVersion);
  });

  return removeOSDups(
    osIds.map((osId) => {
      const nameAnnotation = `${TEMPLATE_OS_NAME_ANNOTATION}/${osId}`;
      const template = sortedTemplates.find(
        (t) =>
          !!Object.keys(getAnnotations(t, {})).find((annotation) => annotation === nameAnnotation),
      );

      return {
        id: osId,
        name: getAnnotation(template, nameAnnotation),
        baseImageName: getParameterValue(template, TEMPLATE_BASE_IMAGE_NAME_PARAMETER),
        baseImageNamespace: getParameterValue(template, TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER),
      };
    }),
  );
};

export const getTemplateWorkloadProfiles = (templates: TemplateKind[]) =>
  getTemplatesLabelValues(templates, TEMPLATE_WORKLOAD_LABEL);

export const getTemplateSizeRequirement = (
  template: TemplateKind,
  templateSource: TemplateSourceStatus,
): string => {
  const vm = selectVM(template);
  const dvTemplates = getDataVolumeTemplates(vm);
  const templatesSize = dvTemplates.reduce((acc, dvt) => {
    const size = (dvt.spec.pvc?.resources?.requests as any)?.storage;
    if (size) {
      return acc;
    }
    return acc + convertToBaseValue(size);
  }, 0);
  const baseImageSize =
    isCommonTemplate(template) && !isTemplateSourceError(templateSource) && templateSource?.pvc
      ? convertToBaseValue(templateSource.pvc.spec.resources.requests.storage)
      : 0;
  return `${pluralize(getDisks(vm).length, 'Disk')} | ${
    humanizeBinaryBytes(templatesSize + baseImageSize).string
  }`;
};

export const getTemplateMemory = (template: TemplateKind): string => {
  const baseMemoryValue = convertToBaseValue(getMemory(selectVM(template)));
  return humanizeBinaryBytes(baseMemoryValue).string;
};
