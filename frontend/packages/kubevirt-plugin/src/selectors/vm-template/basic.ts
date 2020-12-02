import { TFunction } from 'i18next';
import { TemplateKind } from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared/src/constants/common';
import { VMKind } from '../../types/vm';
import { VirtualMachineModel } from '../../models';
import { getAnnotation } from '../selectors';
import {
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_VM,
  TEMPLATE_PROVIDER_ANNOTATION,
  TEMPLATE_SUPPORT_LEVEL,
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

export const getTemplateSupport = (template: TemplateKind): string =>
  getAnnotation(template, TEMPLATE_SUPPORT_LEVEL);

export const getTemplateType = (
  template: TemplateItem,
): typeof TEMPLATE_TYPE_BASE | typeof TEMPLATE_TYPE_VM =>
  template.isCommon ? TEMPLATE_TYPE_BASE : TEMPLATE_TYPE_VM;

export const getTemplateProvider = (
  t: TFunction,
  template: TemplateKind,
  withProviderPrefix = false,
): string => {
  const provider = getAnnotation(template, TEMPLATE_PROVIDER_ANNOTATION);
  if (provider) {
    return withProviderPrefix
      ? t('kubevirt-plugin~Provided by {{provider}} (User)', { provider })
      : t('kubevirt-plugin~{{provider}} (User)', { provider });
  }
  return withProviderPrefix ? t('kubevirt-plugin~Provided by User') : t('kubevirt-plugin~User');
};

export const templateProviders = (t: TFunction): { id: ProvidedType; title: string }[] => [
  { id: 'supported', title: t('kubevirt-plugin~Red Hat Supported') },
  { id: 'user-supported', title: t('kubevirt-plugin~User Supported') },
  { id: 'provided', title: t('kubevirt-plugin~Red Hat Provided') },
  { id: 'user', title: t('kubevirt-plugin~User Provided') },
];

export type ProvidedType = 'supported' | 'provided' | 'user' | 'user-supported';

export const getTemplateKindProviderType = (template: TemplateKind): ProvidedType => {
  const isCommon = isCommonTemplate(template);
  if (getTemplateSupport(template)) {
    return isCommon ? 'supported' : 'user-supported';
  }
  return isCommon ? 'provided' : 'user';
};

export const getTemplateProviderType = (templateItem: TemplateItem): ProvidedType =>
  getTemplateKindProviderType(templateItem?.variants?.[0]);
