import { TFunction } from 'i18next';
import { isUpstream } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  ANNOTATIONS,
  TEMPLATE_DEPRECATED_ANNOTATION,
  TEMPLATE_PARENT_PROVIDER_ANNOTATION,
  TEMPLATE_PARENT_PROVIDER_URL,
  TEMPLATE_PARENT_SUPPORT_LEVEL,
  TEMPLATE_PROVIDER_ANNOTATION,
  TEMPLATE_PROVIDER_URL,
  TEMPLATE_SUPPORT_LEVEL,
  TEMPLATE_TYPE_BASE,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
} from '../../constants';
import { VirtualMachineModel } from '../../models';
import { TemplateItem } from '../../types/template';
import { VMKind } from '../../types/vm';
import { getAnnotation } from '../selectors';

export const selectVM = (vmTemplate: TemplateKind): VMKind =>
  vmTemplate && vmTemplate.objects
    ? vmTemplate.objects.find((obj) => obj.kind === VirtualMachineModel.kind)
    : null;

export const getTemplateName = (template: TemplateKind): string =>
  getAnnotation(template, ANNOTATIONS.displayName, template?.metadata.name);

export const isCommonTemplate = (template: TemplateKind): boolean =>
  template?.metadata?.labels?.[TEMPLATE_TYPE_LABEL] === TEMPLATE_TYPE_BASE;

export const isDeprecatedTemplate = (template: TemplateKind): boolean =>
  getAnnotation(template, TEMPLATE_DEPRECATED_ANNOTATION) === 'true';

export const getTemplateSupport = (
  template: TemplateKind,
): { provider: string; providerURL: string; parent: string; parentURL: string } => {
  const support = {
    provider: getAnnotation(template, TEMPLATE_SUPPORT_LEVEL),
    providerURL: getAnnotation(template, TEMPLATE_PROVIDER_URL),
    parent: undefined,
    parentURL: undefined,
  };

  if (isUpstream()) {
    return support;
  }

  support.parent = getAnnotation(template, TEMPLATE_PARENT_SUPPORT_LEVEL);
  support.parentURL = getAnnotation(template, TEMPLATE_PARENT_PROVIDER_URL);
  return support;
};

export const getTemplateType = (
  template: TemplateItem,
): typeof TEMPLATE_TYPE_BASE | typeof TEMPLATE_TYPE_VM =>
  template.isCommon ? TEMPLATE_TYPE_BASE : TEMPLATE_TYPE_VM;

export const getTemplateProvider = (
  t: TFunction,
  template: TemplateKind,
  withProviderPrefix = false,
): string => {
  let provider = getAnnotation(template, TEMPLATE_PROVIDER_ANNOTATION);
  const isCommon = isCommonTemplate(template);
  if ((!provider || provider === 'Red Hat' || provider === 'KubeVirt') && isCommon) {
    provider = isUpstream() ? 'KubeVirt' : 'Red Hat';
  }
  if (provider) {
    return withProviderPrefix
      ? t('kubevirt-plugin~Provided by {{provider}}', { provider })
      : provider;
  }
  return withProviderPrefix ? t('kubevirt-plugin~Provided by User') : t('kubevirt-plugin~User');
};

export const getTemplateParentProvider = (template: TemplateKind): string =>
  getAnnotation(template, TEMPLATE_PARENT_PROVIDER_ANNOTATION);

export const templateProviders = (t: TFunction): { id: ProvidedType; title: string }[] => {
  const providers: { id: ProvidedType; title: string }[] = [
    {
      id: 'provided',
      title: isUpstream() ? t('kubevirt-plugin~KubeVirt') : t('kubevirt-plugin~Red Hat'),
    },
    { id: 'user', title: t('kubevirt-plugin~User') },
  ];
  return providers;
};

export type ProvidedType = 'supported' | 'provided' | 'user' | 'user-supported';

export const getTemplateKindProviderType = (template: TemplateKind): ProvidedType => {
  return isCommonTemplate(template) ? 'provided' : 'user';
};

export const getTemplateProviderType = (templateItem: TemplateItem): ProvidedType =>
  getTemplateKindProviderType(templateItem?.variants?.[0]);
