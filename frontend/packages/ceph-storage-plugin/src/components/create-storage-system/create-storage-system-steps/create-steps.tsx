import { TFunction } from 'i18next';
import { WizardStep } from '@patternfly/react-core';
import { WizardState } from '../reducer';
import { BackingStorageType, RHCS, StepsId } from '../../../constants/create-storage-system';

export const createSteps = (
  t: TFunction,
  state: WizardState,
  hasStorageCluster: boolean,
): WizardStep[] => {
  const { backingStorage, currentStep } = state;
  const { externalProvider } = backingStorage;

  const commonSteps = {
    capacityAndNodes: {
      id: StepsId.CapacityAndNodes,
      name: t('ceph-storage-plugin~Capacity and nodes'),
    },
    securityAndNetwork: {
      id: StepsId.SecurityAndNetwork,
      name: t('ceph-storage-plugin~Security and network'),
    },
    reviewAndCreate: {
      id: StepsId.ReviewAndCreate,
      name: t('ceph-storage-plugin~Review and create'),
    },
  };

  const rhcsExternalProviderSteps = [
    {
      id: StepsId.ConnectionDetails,
      canJumpTo: currentStep >= 2,
      name: t('ceph-storage-plugin~Connection details'),
    },
    {
      id: StepsId.ReviewAndCreate,
      canJumpTo: currentStep >= 3,
      ...commonSteps.reviewAndCreate,
    },
  ];

  const nonRhcsExternalProviderStep = {
    canJumpTo: currentStep >= 2,
    id: StepsId.CreateStorageClass,
    name: t('ceph-storage-plugin~Create storage class'),
  };

  switch (backingStorage.type) {
    case BackingStorageType.EXISTING:
      return [
        {
          canJumpTo: currentStep >= 2,
          ...commonSteps.capacityAndNodes,
        },
        {
          canJumpTo: currentStep >= 3,
          ...commonSteps.securityAndNetwork,
        },
        {
          canJumpTo: currentStep >= 4,
          ...commonSteps.reviewAndCreate,
        },
      ];
    case BackingStorageType.LOCAL_DEVICES:
      return [
        {
          id: StepsId.CreateLocalVolumeSet,
          canJumpTo: currentStep >= 2,
          name: t('ceph-storage-plugin~Create local volume set'),
        },
        {
          canJumpTo: currentStep >= 3,
          ...commonSteps.capacityAndNodes,
        },
        {
          canJumpTo: currentStep >= 4,
          id: StepsId.SecurityAndNetwork,
          ...commonSteps.securityAndNetwork,
        },
        {
          canJumpTo: currentStep >= 5,
          id: StepsId.ReviewAndCreate,
          ...commonSteps.reviewAndCreate,
        },
      ];
    case BackingStorageType.EXTERNAL:
      if (externalProvider === RHCS) {
        return rhcsExternalProviderSteps;
      }
      if (!hasStorageCluster) {
        return [
          nonRhcsExternalProviderStep,
          { canJumpTo: currentStep >= 3, ...commonSteps.capacityAndNodes },
          {
            canJumpTo: currentStep >= 4,
            ...commonSteps.securityAndNetwork,
          },
          {
            canJumpTo: currentStep >= 5,
            ...commonSteps.reviewAndCreate,
          },
        ];
      }
      return [
        nonRhcsExternalProviderStep,
        {
          canJumpTo: currentStep >= 3,
          ...commonSteps.reviewAndCreate,
        },
      ];
    default:
      return [];
  }
};
