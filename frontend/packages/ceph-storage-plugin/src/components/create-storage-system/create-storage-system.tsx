import * as React from 'react';
import { match as RouteMatch } from 'react-router';
import { useTranslation } from 'react-i18next';
import { Wizard, WizardStep } from '@patternfly/react-core';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { ListKind } from '@console/internal/module/k8s';
import { InfrastructureModel } from '@console/internal/models';
import { CreateStorageSystemFooter } from './footer';
import { CreateStorageSystemHeader } from './header';
import { BackingStorage } from './create-storage-system-steps';
import { initialState, reducer, WizardReducer } from './reducer';
import { createSteps } from './create-steps';
import {
  Steps,
  StepsName,
  STORAGE_CLUSTER_SYSTEM_KIND,
} from '../../constants/create-storage-system';
import { StorageSystemKind } from '../../types';
import { StorageSystemModel } from '../../models';

const CreateStorageSystem: React.FC<CreateStorageSystemProps> = ({ match }) => {
  const { t } = useTranslation();
  const [state, dispatch] = React.useReducer<WizardReducer>(reducer, initialState);
  const [ssList, ssLoaded, ssLoadError] = useK8sGet<ListKind<StorageSystemKind>>(
    StorageSystemModel,
  );
  const [infra, infraLoaded, infraLoadError] = useK8sGet<any>(InfrastructureModel, 'cluster');
  const infraType = infra?.spec?.platformSpec?.type;

  const { url } = match;

  let wizardSteps: WizardStep[] = [];
  let hasOCS: boolean = false;

  if (ssLoaded && !ssLoadError && infraLoaded && !infraLoadError) {
    hasOCS = ssList?.items?.some((ss) => ss.spec.kind === STORAGE_CLUSTER_SYSTEM_KIND);
    wizardSteps = createSteps(t, state, dispatch, infraType, hasOCS);
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
          infraType={infraType}
          error={ssLoadError || infraLoadError}
          loaded={ssLoaded && infraLoaded}
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
            disableNext={!ssLoaded || !!ssLoadError || !infraLoaded || !!infraLoadError}
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
