import { TemplateKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared/src/constants/common';
import { VMKind } from '../../types/vm';
import { VirtualMachineModel } from '../../models';
import { getAnnotation } from '../selectors';
import {
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
  ANNOTATION_USER_PROVIDER,
} from '../../constants';
import { TemplateItem } from '../../types/template';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  vmTemplate && vmTemplate.objects
    ? vmTemplate.objects.find((obj) => obj.kind === VirtualMachineModel.kind)
    : null;

export const getTemplateName = (template: TemplateKind): string =>
  getAnnotation(template, ANNOTATIONS.displayName, template?.metadata.name);

export const isCommonTemplate = (template: TemplateKind): boolean =>
  template?.metadata?.labels?.[TEMPLATE_TYPE_LABEL] === TEMPLATE_TYPE_BASE;

export const isTemplateSupported = (template: TemplateKind): boolean =>
  isCommonTemplate(template) &&
  (template.metadata.name.startsWith('rhel') || template.metadata.name.startsWith('win'));

export const getTemplateType = (
  template: TemplateItem,
): typeof TEMPLATE_TYPE_BASE | typeof TEMPLATE_TYPE_VM =>
  template.isCommon ? TEMPLATE_TYPE_BASE : TEMPLATE_TYPE_VM;

export const getTemplateProvider = (template: TemplateKind): string => {
  if (isCommonTemplate(template)) {
    return 'Red Hat';
  }
  const provider = getAnnotation(template, ANNOTATION_USER_PROVIDER);
  return provider ? `${provider} (User)` : 'User';
};

export const templateProviders: { id: ProvidedType; title: string }[] = [
  { id: 'supported', title: 'Red Hat Supported' },
  { id: 'provided', title: 'Red Hat Provided' },
  { id: 'user', title: 'User Provided' },
];

export type ProvidedType = 'supported' | 'provided' | 'user';

export const getTemplateProviderType = (templateItem: TemplateItem): ProvidedType => {
  const [template] = templateItem.variants;
  if (isTemplateSupported(template)) {
    return 'supported';
  }
  if (isCommonTemplate(template)) {
    return 'provided';
  }
  return 'user';
};
