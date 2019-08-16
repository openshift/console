import * as _ from 'lodash';
import { TemplateKind } from '@console/internal/module/k8s';
import { VirtualMachineModel } from '../../models';
import { VMKind } from '../../types';
import { TEMPLATE_FLAVOR_LABEL } from '../../constants';
import { getLabels } from '../selectors';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  _.get(vmTemplate, 'objects', []).find((obj) => obj.kind === VirtualMachineModel.kind);

export const getTemplatesLabelValues = (templates: TemplateKind[], label: string) => {
  const labelValues = [];
  (templates || []).forEach(t => {
    const labels = Object.keys(getLabels(t, [])).filter(l => l.startsWith(label));
    labels.forEach(l => {
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

export const getTemplateFlavors = (vmTemplates: TemplateKind[]) => getTemplatesLabelValues(vmTemplates, TEMPLATE_FLAVOR_LABEL);
