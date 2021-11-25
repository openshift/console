import { useTranslation } from 'react-i18next';
import { useAccessReview2 } from '@console/internal/components/utils';
import { TemplateModel } from '@console/internal/models';
import { K8sVerb } from '@console/internal/module/k8s/types';
import { NetworkAttachmentDefinitionModel } from '@console/network-attachment-definition-plugin';
import { useFlag } from '@console/shared';
import { KUBEVIRT_OS_IMAGES_NS, NAMESPACE_OPENSHIFT, OPENSHIFT_OS_IMAGES_NS } from '../constants';
import { FLAG_KUBEVIRT_CDI } from '../flags/const';

export type UsePermissionsCardPermissions = {
  capabilitiesData: { taskName: string; isLoading: boolean; allowed: boolean }[];
  permissionsLoading: boolean;
  numAllowedCapabilities: number;
  numNotAllowedCapabilities: number;
};

export const usePermissionsCardPermissions = (): UsePermissionsCardPermissions => {
  const { t } = useTranslation();
  const cdiInstalled = useFlag(FLAG_KUBEVIRT_CDI);

  const [canReadOpenshiftNs, canReadOpenshiftNsLoading] = useAccessReview2({
    namespace: NAMESPACE_OPENSHIFT,
    verb: 'get' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canWriteToOpenshiftNs, canWriteToOpenshiftNsLoading] = useAccessReview2({
    namespace: NAMESPACE_OPENSHIFT,
    verb: 'create' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canReadOpenshiftOsImgNs, canReadOpenshiftOsImgNsLoading] = useAccessReview2({
    namespace: OPENSHIFT_OS_IMAGES_NS,
    verb: 'get' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canReadKvOsImgNs, canReadKvOsImgNsLoading] = useAccessReview2({
    namespace: KUBEVIRT_OS_IMAGES_NS,
    verb: 'get' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canWriteToKvOsImgNs, canWriteToKvOsImgNsLoading] = useAccessReview2({
    namespace: KUBEVIRT_OS_IMAGES_NS,
    verb: 'create' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canWriteToOpenshiftOsImgNs, canWriteToOpenshiftOsImgNsLoading] = useAccessReview2({
    namespace: OPENSHIFT_OS_IMAGES_NS,
    verb: 'create' as K8sVerb,
    resource: TemplateModel.plural,
  });

  const [canReadNads, canReadNadsLoading] = useAccessReview2({
    verb: 'get' as K8sVerb,
    resource: NetworkAttachmentDefinitionModel.plural,
  });

  const canReadOsImagesNs = canReadKvOsImgNs && canReadOpenshiftOsImgNs;
  const canReadOsImagesNsLoading = canReadKvOsImgNsLoading && canReadOpenshiftOsImgNsLoading;

  const basePermissionsAllowed = canReadOpenshiftNs && canReadOsImagesNs;
  const basePermissionsLoading = canReadOpenshiftNsLoading && canReadOsImagesNsLoading;

  const canWriteToOsImagesNs = canWriteToKvOsImgNs && canWriteToOpenshiftOsImgNs;
  const canWriteToOsImagesNsLoading =
    canWriteToKvOsImgNsLoading && canWriteToOpenshiftOsImgNsLoading;

  const capabilitiesData = [
    {
      taskName: t('kubevirt-plugin~Access to public templates'),
      isLoading: basePermissionsLoading,
      allowed: basePermissionsAllowed,
    },
    {
      taskName: t('kubevirt-plugin~Access to public boot sources'),
      isLoading: basePermissionsLoading,
      allowed: basePermissionsAllowed,
    },
    {
      taskName: t('kubevirt-plugin~Clone a VM'),
      isLoading: basePermissionsLoading,
      allowed: basePermissionsAllowed && cdiInstalled,
    },
    {
      taskName: t('kubevirt-plugin~Attach VM to multiple networks'),
      isLoading: basePermissionsLoading && canReadNadsLoading,
      allowed: basePermissionsAllowed && canReadNads,
    },
    {
      taskName: t('kubevirt-plugin~Upload a base image from local disk'),
      isLoading: basePermissionsLoading && canWriteToKvOsImgNsLoading,
      allowed: basePermissionsAllowed && canWriteToKvOsImgNs,
    },
    {
      taskName: t('kubevirt-plugin~Share templates'),
      isLoading:
        basePermissionsLoading && canWriteToOpenshiftNsLoading && canWriteToOsImagesNsLoading,
      allowed: basePermissionsAllowed && canWriteToOpenshiftNs && canWriteToOsImagesNs,
    },
  ];

  const numAllowedCapabilities = capabilitiesData.reduce(
    (acc, task) => (task.allowed ? acc + 1 : acc),
    0,
  );
  const numNotAllowedCapabilities = capabilitiesData?.length - numAllowedCapabilities;
  const permissionsLoading = capabilitiesData.filter((task) => task.isLoading === true).length > 0;

  return {
    capabilitiesData,
    permissionsLoading,
    numAllowedCapabilities,
    numNotAllowedCapabilities,
  };
};
