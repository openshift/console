import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { Form, Stack, StackItem } from '@patternfly/react-core';
import { getNamespace } from '@console/shared';
import { CatalogExtensionHook, CatalogItem } from '@console/plugin-sdk';
import { SectionHeading } from '@console/internal/components/utils';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { FormRow } from '../../form/form-row';
import { getOperatingSystemName, getWorkloadProfile } from '../../../selectors/vm';
import { getTemplateOSIcon } from '../../vm-templates/os-icons';
import {
  getTemplateName,
  getTemplateProvider,
  getTemplateKindProviderType,
  getTemplateSupport,
  templateProviders,
  isCommonTemplate,
  getTemplateParentProvider,
} from '../../../selectors/vm-template/basic';
import {
  getTemplateFlavorDesc,
  getTemplateSizeRequirement,
} from '../../../selectors/vm-template/advanced';
import { isTemplateSourceError } from '../../../statuses/template/types';
import { SourceDescription } from '../../vm-templates/vm-template-source';
import { useVmTemplatesResources } from '../hooks/use-vm-templates-resources';
import { filterTemplates } from '../../vm-templates/utils';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { TemplateItem } from '../../../types/template';
import './create-vm-side-drawer.scss';

const normalizeVmTemplates = (
  templates: TemplateItem[],
  {
    pods,
    pvcs,
    dataVolumes,
  }: { pods: PodKind[]; pvcs: PersistentVolumeClaimKind[]; dataVolumes: V1alpha1DataVolume[] },
  activeNamespace: string = '',
  t: TFunction,
): CatalogItem[] =>
  templates.map((temp) => {
    const [tmp] = temp?.variants;
    const sourceStatus = getTemplateSourceStatus({
      pods,
      pvcs,
      dataVolumes,
      template: tmp,
    });
    const displayName = getTemplateName(tmp) || tmp.kind;
    const provider = getTemplateProvider(t, tmp);
    const imgUrl = getTemplateOSIcon(tmp);
    const workloadType = getWorkloadProfile(tmp) || t('kubevirt-plugin~Not available');
    const flavor = getTemplateFlavorDesc(tmp, false);
    const storage = getTemplateSizeRequirement(tmp, sourceStatus);
    const providerType = getTemplateKindProviderType(tmp);

    const params = new URLSearchParams();
    params.set('template', tmp?.metadata?.name);
    params.set('templateNs', tmp?.metadata?.namespace);
    params.set('namespace', activeNamespace);

    const cardDescription = (
      <Stack>
        <StackItem>
          <strong>{t('kubevirt-plugin~Type')}:</strong> {workloadType}
        </StackItem>
        <StackItem>
          <strong>{t('kubevirt-plugin~Flavor')}:</strong> {flavor}
        </StackItem>
        <StackItem>
          <strong>{t('kubevirt-plugin~Storage')}:</strong> {storage}
        </StackItem>
      </Stack>
    );

    const detailsDescription = [
      {
        value: isCommonTemplate(tmp)
          ? t(
              'kubevirt-plugin~This template is {{providerParam}}. The Boot source is also maintained by Red Hat.',
              { providerParam: getTemplateProvider(t, tmp, true) },
            )
          : t('kubevirt-plugin~This template is {{providerParam}}', {
              providerParam: getTemplateProvider(t, tmp, true),
            }),
      },
      {
        value: (
          <>
            <SectionHeading text={t('kubevirt-plugin~Details')} />
            <Form className="vm-side-drawer-form">
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Operating System')}
                fieldId="dev-console-vm-os"
              >
                {getOperatingSystemName(tmp) || t('kubevirt-plugin~Not available')}
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                fieldId="dev-console-vm-flavor"
                title={t('kubevirt-plugin~Flavor')}
                help={t(
                  'kubevirt-plugin~You will be able to change the flavor after selecting this template',
                )}
              >
                {getTemplateFlavorDesc(tmp)}
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Storage')}
                fieldId="dev-console-vm-storage"
              >
                {getTemplateSizeRequirement(tmp, sourceStatus)}
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Boot source')}
                fieldId="dev-console-vm-boot-source"
              >
                <SourceDescription
                  sourceStatus={!isTemplateSourceError(sourceStatus) && sourceStatus}
                  template={tmp}
                />
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Type')}
                fieldId="dev-console-vm-workload"
              >
                {getWorkloadProfile(tmp) || t('kubevirt-plugin~Not available')}
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Template Namespace')}
                fieldId="dev-console-vm-namespace"
              >
                {getNamespace(tmp)}
              </FormRow>
            </Form>
          </>
        ),
      },
    ];

    const templateSupport = getTemplateSupport(tmp);
    const parentProvider = getTemplateParentProvider(tmp);
    let support: React.ReactNode = '-';
    if (templateSupport.parent && parentProvider && templateSupport.provider && provider) {
      support = (
        <>
          <div>
            {parentProvider} - {templateSupport.parent}
          </div>
          <div>
            {provider} - {templateSupport.provider}
          </div>
        </>
      );
    } else if (templateSupport.parent && parentProvider) {
      support = `${parentProvider} - ${templateSupport.parent}`;
    } else if (templateSupport.provider && provider) {
      support = templateSupport.provider;
    }

    const detailsProperties = [
      {
        label: t('kubevirt-plugin~Support'),
        value: support,
      },
    ];

    return {
      uid: tmp?.metadata?.uid,
      type: 'VmTemplate',
      name: displayName,
      description: cardDescription,
      provider,
      creationTimestamp: tmp?.metadata?.creationTimestamp,
      attributes: {
        name: tmp?.metadata?.name,
        templateProvider: templateProviders(t).find((p) => providerType === p.id)?.title,
      },
      icon: {
        class: null,
        url: imgUrl,
      },
      cta: {
        label: t('kubevirt-plugin~Create from template'),
        href: `/catalog/create-vm?${params.toString()}`,
      },
      details: {
        properties: detailsProperties,
        descriptions: detailsDescription,
      },
    };
  });

const useCatalogVmTemplates: CatalogExtensionHook<CatalogItem[]> = ({
  namespace,
}): [CatalogItem[], boolean, any] => {
  const { t } = useTranslation();
  const {
    pods,
    dataVolumes,
    pvcs,
    userTemplates,
    baseTemplates,
    resourcesLoaded,
    resourcesLoadError,
  } = useVmTemplatesResources(namespace);

  return React.useMemo(() => {
    const templates = filterTemplates(userTemplates, baseTemplates).filter((tmp) => {
      const tempSourceStatus = getTemplateSourceStatus({
        pods,
        pvcs,
        dataVolumes,
        template: tmp.variants[0],
      });

      if (isTemplateSourceError(tempSourceStatus) || !tempSourceStatus?.isReady) {
        return false;
      }
      return true;
    });

    return [
      normalizeVmTemplates(templates, { pods, pvcs, dataVolumes }, namespace, t),
      resourcesLoaded,
      resourcesLoadError,
    ];
  }, [
    t,
    namespace,
    userTemplates,
    baseTemplates,
    dataVolumes,
    pods,
    pvcs,
    resourcesLoadError,
    resourcesLoaded,
  ]);
};

export default useCatalogVmTemplates;
