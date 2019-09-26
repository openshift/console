import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { getAnnotation, getAnnotations, getLabels } from '../selectors';
import {
  TEMPLATE_FLAVOR_LABEL,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  TEMPLATE_WORKLOAD_LABEL,
} from '../../constants/vm';

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

export const getTemplateOperatingSystems = (templates: TemplateKind[]) => {
  const osIds = getTemplatesLabelValues(templates, TEMPLATE_OS_LABEL);
  return osIds.map((osId) => {
    const nameAnnotation = `${TEMPLATE_OS_NAME_ANNOTATION}/${osId}`;
    const template = templates.find(
      (t) => !!Object.keys(getAnnotations(t)).find((annotation) => annotation === nameAnnotation),
    );
    return {
      id: osId,
      name: getAnnotation(template, nameAnnotation),
    };
  });
};

export const getTemplateWorkloadProfiles = (templates: TemplateKind[]) =>
  getTemplatesLabelValues(templates, TEMPLATE_WORKLOAD_LABEL);
