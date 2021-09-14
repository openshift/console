import * as React from 'react';
import { TFunction } from 'i18next';
import { WizardStep } from '@patternfly/react-core';
import {
  CapacityAndNodes,
  CreateStorageClass,
  ConnectionDetails,
  ReviewAndCreate,
  CreateLocalVolumeSet,
  SecurityAndNetwork,
  Security,
} from './create-storage-system-steps';
import { WizardDispatch, WizardState } from './reducer';
import {
  BackingStorageType,
  DeploymentType,
  Steps,
  StepsName,
} from '../../constants/create-storage-system';
import { OCSServiceModel } from '../../models';

export const createSteps = (
  t: TFunction,
  state: WizardState,
  dispatch: WizardDispatch,
  hasOCS: boolean,
): WizardStep[] => {
  const {
    backingStorage,
    stepIdReached,
    createStorageClass,
    storageClass,
    capacityAndNodes,
    securityAndNetwork,
    nodes,
    createLocalVolumeSet,
  } = state;
  const { externalStorage, deployment } = backingStorage;
  const { encryption, kms } = securityAndNetwork;

  const commonSteps = {
    capacityAndNodes: {
      name: StepsName(t)[Steps.CapacityAndNodes],
      component: (
        <CapacityAndNodes
          dispatch={dispatch}
          state={capacityAndNodes}
          storageClass={storageClass}
          volumeSetName={createLocalVolumeSet.volumeSetName}
          nodes={nodes}
        />
      ),
    },
    securityAndNetwork: {
      name: StepsName(t)[Steps.SecurityAndNetwork],
      component: <SecurityAndNetwork state={securityAndNetwork} dispatch={dispatch} />,
    },
    reviewAndCreate: {
      name: StepsName(t)[Steps.ReviewAndCreate],
      component: <ReviewAndCreate state={state} hasOCS={hasOCS} />,
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

  if (deployment === DeploymentType.MCG)
    return [
      {
        id: 2,
        name: StepsName(t)[Steps.Security],
        canJumpTo: stepIdReached >= 2,
        component: <Security encryption={encryption} kms={kms} dispatch={dispatch} isMCG />,
      },
      {
        id: 3,
        canJumpTo: stepIdReached >= 3,
        ...commonSteps.reviewAndCreate,
      },
    ];

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
          component: (
            <CreateLocalVolumeSet
              state={state.createLocalVolumeSet}
              dispatch={dispatch}
              storageClass={storageClass}
              nodes={nodes}
              stepIdReached={stepIdReached}
            />
          ),
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
