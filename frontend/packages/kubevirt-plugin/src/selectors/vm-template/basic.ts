import { TemplateKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared/src/constants/common';
import { VMKind } from '../../types/vm';
import { VirtualMachineModel } from '../../models';
import { getAnnotation } from '../selectors';
import { TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_BASE } from '../../constants';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  vmTemplate && vmTemplate.objects
    ? vmTemplate.objects.find((obj) => obj.kind === VirtualMachineModel.kind)
    : null;

export const getTemplateName = (template: TemplateKind): string =>
  getAnnotation(template, ANNOTATIONS.displayName, template.metadata.name);

export const isCommonTemplate = (template: TemplateKind): boolean =>
  template.metadata.labels?.[TEMPLATE_TYPE_LABEL] === TEMPLATE_TYPE_BASE;
