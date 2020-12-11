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

export const getTemplateSupport = (template: TemplateKind): string => {
  const isUpstream = window.SERVER_FLAGS.branding === 'okd';
  if (isUpstream) {
    return undefined;
  }
  const support = getAnnotation(template, TEMPLATE_SUPPORT_LEVEL);
  if (support) {
    return support;
  }
  if (
    isCommonTemplate(template) &&
    (template.metadata.name.startsWith('win') || template.metadata.name.startsWith('rhel'))
  ) {
    return 'Full';
  }
  return undefined;
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
      : t('kubevirt-plugin~{{provider}}', { provider });
  }
  return withProviderPrefix ? t('kubevirt-plugin~Provided by User') : t('kubevirt-plugin~User');
};

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
  if (getTemplateSupport(template)) {
    return isCommon ? 'supported' : 'user-supported';
  }
  return isCommon ? 'provided' : 'user';
};

export const getTemplateProviderType = (templateItem: TemplateItem): ProvidedType =>
  getTemplateKindProviderType(templateItem?.variants?.[0]);
