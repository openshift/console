import * as React from 'react';
import { match as RouteMatch } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ListKind } from '@console/internal/module/k8s';
import { CreateStorageSystemFooter } from './footer';
import { CreateStorageSystemHeader } from './header';
import { BackingStorage } from './create-storage-system-steps';
import { initialState, reducer, WizardReducer } from './reducer';
import { createSteps } from './create-steps';
import { Steps, StepsName, StorageClusterIdentifier } from '../../constants/create-storage-system';
import { StorageSystemKind } from '../../types';
import { StorageSystemModel } from '../../models';

const CreateStorageSystem: React.FC<CreateStorageSystemProps> = ({ match }) => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer<WizardReducer>(reducer, initialState);
  const [ssList, ssLoaded, ssLoadError] = useK8sGet<ListKind<StorageSystemKind>>(
    StorageSystemModel,
  );

  const { url } = match;

  let wizardSteps: WizardStep[] = [];
  let hasOCS: boolean = false;

  if (ssLoaded && !ssLoadError) {
    hasOCS = ssList?.items?.some((ss) => ss.spec.kind === StorageClusterIdentifier);
    wizardSteps = createSteps(t, state, dispatch, hasOCS);
  }

  const steps: WizardStep[] = [
    {
      id: 1,
      name: StepsName(t)[Steps.BackingStorage],
      component: (
        <BackingStorage
          state={state.backingStorage}
          storageClass={state.storageClass}
          dispatch={dispatch}
          storageSystems={ssList?.items || []}
          stepIdReached={state.stepIdReached}
          error={ssLoadError}
          loaded={ssLoaded}
        />
      ),
    },
    ...wizardSteps,
  ];

  return (
    <>
      <CreateStorageSystemHeader url={url} />
      <Wizard
        steps={steps}
        footer={
          <CreateStorageSystemFooter
            state={state}
            hasOCS={hasOCS}
            dispatch={dispatch}
            disableNext={!ssLoaded || !!ssLoadError}
          />
        }
        cancelButtonText={t('ceph-storage-plugin~Cancel')}
        nextButtonText={t('ceph-storage-plugin~Next')}
        backButtonText={t('ceph-storage-plugin~Back')}
      />
    </>
  );
};

type CreateStorageSystemProps = {
  match: RouteMatch<{ ns: string; appName: string }>;
};

export default CreateStorageSystem;
