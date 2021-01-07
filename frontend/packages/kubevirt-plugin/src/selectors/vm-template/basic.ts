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
  TEMPLATE_PARENT_SUPPORT_LEVEL,
  TEMPLATE_PARENT_PROVIDER_ANNOTATION,
  TEMPLATE_PROVIDER_URL,
  TEMPLATE_PARENT_PROVIDER_URL,
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

export const getTemplateSupport = (
  template: TemplateKind,
): { provider: string; providerURL: string; parent: string; parentURL: string } => {
  const support = {
    provider: getAnnotation(template, TEMPLATE_SUPPORT_LEVEL),
    providerURL: getAnnotation(template, TEMPLATE_PROVIDER_URL),
    parent: undefined,
    parentURL: undefined,
  };

  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  if (isUpstream) {
    return support;
  }

  if (
    !support.provider &&
    isCommonTemplate(template) &&
    (template.metadata.name.startsWith('win') || template.metadata.name.startsWith('rhel'))
  ) {
    support.provider = 'Full';
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
  if (!provider && isCommonTemplate(template)) {
    const isUpstream = window.SERVER_FLAGS.branding === 'okd';
    provider = isUpstream ? 'KubeVirt' : 'Red Hat';
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
  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  const providers: { id: ProvidedType; title: string }[] = [
    { id: 'user-supported', title: t('kubevirt-plugin~User Supported') },
    {
      id: 'provided',
      title: isUpstream
        ? t('kubevirt-plugin~KubeVirt Provided')
        : t('kubevirt-plugin~Red Hat Provided'),
    },
    { id: 'user', title: t('kubevirt-plugin~User Provided') },
  ];
  if (!isUpstream) {
    providers.unshift({
      id: 'supported',
      title: t('kubevirt-plugin~Red Hat Supported'),
    });
  }
  return providers;
};

export type ProvidedType = 'supported' | 'provided' | 'user' | 'user-supported';

export const getTemplateKindProviderType = (template: TemplateKind): ProvidedType => {
  const isCommon = isCommonTemplate(template);
  const support = getTemplateSupport(template);
  if (support.parent || support.provider) {
    return isCommon ? 'supported' : 'user-supported';
  }
  return isCommon ? 'provided' : 'user';
};

export const getTemplateProviderType = (templateItem: TemplateItem): ProvidedType =>
  getTemplateKindProviderType(templateItem?.variants?.[0]);
