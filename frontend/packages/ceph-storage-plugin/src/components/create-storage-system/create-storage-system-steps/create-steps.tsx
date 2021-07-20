import * as React from 'react';
import { TFunction } from 'i18next';
import { WizardStep } from '@patternfly/react-core';
import { CreateStorageClass } from './create-storage-class-step';
import { ConnectionDetails } from './connection-details';
import { WizardDispatch, WizardState } from '../reducer';
import { BackingStorageType, Steps, StepsName } from '../../../constants/create-storage-system';
import { OCSServiceModel } from '../../../models';

export const createSteps = (
  t: TFunction,
  state: WizardState,
  dispatch: WizardDispatch,
  hasOCS: boolean,
): WizardStep[] => {
  const { backingStorage, stepIdReached, createStorageClass, storageClass } = state;
  const { externalStorage } = backingStorage;

  const commonSteps = {
    capacityAndNodes: {
      name: StepsName(t)[Steps.CapacityAndNodes],
    },
    securityAndNetwork: {
      name: StepsName(t)[Steps.SecurityAndNetwork],
    },
    reviewAndCreate: {
      name: StepsName(t)[Steps.ReviewAndCreate],
    },
  };

  const rhcsExternalProviderSteps: WizardStep[] = [
    {
      name: StepsName(t)[Steps.ConnectionDetails],
      canJumpTo: stepIdReached >= 2,
      id: 2,
      component: (
        <ConnectionDetails
          state={state.connectionDetails}
          dispatch={dispatch}
          externalStorage={externalStorage}
        />
      ),
    },
    {
      name: StepsName(t)[Steps.ReviewAndCreate],
      canJumpTo: stepIdReached >= 3,
      id: 3,
      ...commonSteps.reviewAndCreate,
    },
  ];

  const nonRhcsExternalProviderStep: WizardStep = {
    canJumpTo: stepIdReached >= 2,
    id: 2,
    name: StepsName(t)[Steps.CreateStorageClass],
    component: (
      <CreateStorageClass
        state={createStorageClass}
        externalStorage={externalStorage}
        dispatch={dispatch}
        storageClass={storageClass}
      />
    ),
  };

  switch (backingStorage.type) {
    case BackingStorageType.EXISTING:
      return [
        {
          id: 2,
          canJumpTo: stepIdReached >= 2,

          ...commonSteps.capacityAndNodes,
        },
        {
          id: 3,
          canJumpTo: stepIdReached >= 3,

          ...commonSteps.securityAndNetwork,
        },
        {
          id: 4,
          canJumpTo: stepIdReached >= 4,
          ...commonSteps.reviewAndCreate,
        },
      ];
    case BackingStorageType.LOCAL_DEVICES:
      return [
        {
          name: StepsName(t)[Steps.CreateLocalVolumeSet],
          canJumpTo: stepIdReached >= 2,
          id: 2,
        },
        {
          canJumpTo: stepIdReached >= 3,
          ...commonSteps.capacityAndNodes,
          id: 3,
        },
        {
          canJumpTo: stepIdReached >= 4,
          name: StepsName(t)[Steps.SecurityAndNetwork],
          ...commonSteps.securityAndNetwork,
          id: 4,
        },
        {
          canJumpTo: stepIdReached >= 5,
          name: StepsName(t)[Steps.ReviewAndCreate],
          ...commonSteps.reviewAndCreate,
          id: 5,
        },
      ];
    case BackingStorageType.EXTERNAL:
      if (externalStorage === OCSServiceModel.kind) {
        return rhcsExternalProviderSteps;
      }
      if (!hasOCS) {
        return [
          nonRhcsExternalProviderStep,
          {
            canJumpTo: stepIdReached >= 3,
            id: 3,
            ...commonSteps.capacityAndNodes,
          },
          {
            canJumpTo: stepIdReached >= 4,
            id: 4,
            ...commonSteps.securityAndNetwork,
          },
          {
            canJumpTo: stepIdReached >= 5,
            id: 5,
            ...commonSteps.reviewAndCreate,
          },
        ];
      }
      return [
        nonRhcsExternalProviderStep,
        {
          canJumpTo: stepIdReached >= 3,
          id: 3,
          ...commonSteps.reviewAndCreate,
        },
      ];
    default:
      return [];
  }
};
