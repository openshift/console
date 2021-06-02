import * as React from 'react';
import { Form, Stack, StackItem } from '@patternfly/react-core';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { CatalogItem, ExtensionHook } from '@console/dynamic-plugin-sdk';
import { humanizeBinaryBytes, SectionHeading } from '@console/internal/components/utils';
import { PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { getNamespace } from '@console/shared';
import { BOOT_SOURCE_AVAILABLE } from '../../../constants';
import { getDescription } from '../../../selectors/selectors';
import { getOperatingSystemName, getWorkloadProfile } from '../../../selectors/vm';
import {
  getTemplateFlavorData,
  getTemplateSizeRequirementInBytes,
} from '../../../selectors/vm-template/advanced';
import {
  getTemplateKindProviderType,
  getTemplateName,
  getTemplateProvider,
  templateProviders,
} from '../../../selectors/vm-template/basic';
import { getTemplateSourceStatus } from '../../../statuses/template/template-source-status';
import { isTemplateSourceError } from '../../../statuses/template/types';
import { V1alpha1DataVolume } from '../../../types/api';
import { TemplateItem } from '../../../types/template';
import { FormRow } from '../../form/form-row';
import { getTemplateOSIcon } from '../../vm-templates/os-icons';
import { filterTemplates } from '../../vm-templates/utils';
import { VMTemplateSupportDescription } from '../../vm-templates/vm-template-resource';
import { SourceDescription } from '../../vm-templates/vm-template-source';
import { useVmTemplatesResources } from '../hooks/use-vm-templates-resources';

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
    const templateProvider = getTemplateProvider(t, tmp);
    const sourceProvider = !isTemplateSourceError(sourceStatus) && sourceStatus?.provider;
    const imgUrl = getTemplateOSIcon(tmp);
    const workloadType = getWorkloadProfile(tmp) || t('kubevirt-plugin~Not available');
    const flavor = t(
      'kubevirt-plugin~{{flavor}}: {{count}} CPU | {{memory}}',
      getTemplateFlavorData(tmp),
    );
    const storage = getTemplateSizeRequirementInBytes(tmp, sourceStatus);
    const storageLabel = storage
      ? humanizeBinaryBytes(storage).string
      : t('kubevirt-plugin~Not available');
    const providerType = getTemplateKindProviderType(tmp);
    const templateDescription = getDescription(tmp);

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
          <strong>{t('kubevirt-plugin~Storage')}:</strong>
          {storageLabel}
        </StackItem>
      </Stack>
    );

    const detailsDescription = [
      {
        value: (
          <Stack hasGutter>
            {templateDescription && <StackItem>{templateDescription}</StackItem>}
            {sourceProvider && sourceProvider !== BOOT_SOURCE_AVAILABLE && (
              <StackItem>
                {t("kubevirt-plugin~This template's boot source is defined by {{providerParam}}", {
                  providerParam: sourceProvider,
                })}
              </StackItem>
            )}
          </Stack>
        ),
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
                {flavor}
              </FormRow>
              <FormRow
                className="vm-side-drawer-form-row"
                title={t('kubevirt-plugin~Storage')}
                fieldId="dev-console-vm-storage"
              >
                {storageLabel}
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

    const detailsProperties = [
      {
        label: t('kubevirt-plugin~Support'),
        value: <VMTemplateSupportDescription template={tmp} />,
      },
    ];

    return {
      uid: tmp?.metadata?.uid,
      type: 'VmTemplate',
      name: displayName,
      description: cardDescription,
      provider: templateProvider,
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

const useCatalogVmTemplates: ExtensionHook<CatalogItem[]> = ({
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
    const templates = filterTemplates([...userTemplates, ...baseTemplates]).filter((tmp) => {
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
