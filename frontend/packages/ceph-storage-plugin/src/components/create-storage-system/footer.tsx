import * as React from 'react';
import { useTranslation } from 'react-i18next';
import * as _ from 'lodash';
import { TFunction } from 'i18next';
import {
  WizardFooter,
  Button,
  WizardContext,
  WizardContextType,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { k8sCreate } from '@console/internal/module/k8s';
import { WizardCommonProps, WizardState } from './reducer';
import { createNoobaaPayload, createSSPayload } from './payloads';
import {
  BackingStorageType,
  DeploymentType,
  Steps,
  StepsName,
} from '../../constants/create-storage-system';
import { OCSServiceModel } from '../../models';
import './create-storage-system.scss';
import {
  getExternalStorage,
  getStorageSystemKind,
  createExternalSSName,
} from '../../utils/create-storage-system';

const validateBackingStorageStep = (backingStorage, sc) => {
  const { type, externalStorage } = backingStorage;
  switch (type) {
    case BackingStorageType.EXISTING:
      return !!sc;
    case BackingStorageType.EXTERNAL:
      return !!externalStorage;
    case BackingStorageType.LOCAL_DEVICES:
      return true;
    default:
      return false;
  }
};

const validateStep = (name: string, state: WizardState, t: TFunction) => {
  const { storageClass, backingStorage, createStorageClass } = state;
  const { externalStorage } = backingStorage;
  const { canGoToNextStep } = getExternalStorage(externalStorage) || {};

  switch (name) {
    case StepsName(t)[Steps.BackingStorage]:
      return validateBackingStorageStep(backingStorage, storageClass);
    case StepsName(t)[Steps.CreateStorageClass]:
      return canGoToNextStep && canGoToNextStep(createStorageClass, storageClass.name);
    case StepsName(t)[Steps.ConnectionDetails]:
      return canGoToNextStep && canGoToNextStep(createStorageClass, storageClass.name);
    case StepsName(t)[Steps.CreateLocalVolumeSet]:
    case StepsName(t)[Steps.CapacityAndNodes]:
    case StepsName(t)[Steps.ReviewAndCreate]:
    case StepsName(t)[Steps.SecurityAndNetwork]:
      return true;
    default:
      return false;
  }
};

const getPayloads = (stepName: string, state: WizardState, t: TFunction) => {
  const { backingStorage, createStorageClass, storageClass, connectionDetails } = state;
  const { externalStorage, deployment, type } = backingStorage;

  const isRhcs = externalStorage === OCSServiceModel.kind;

  const { createPayload, model, displayName } = getExternalStorage(externalStorage) || {};

  if (
    stepName === StepsName(t)[Steps.BackingStorage] &&
    type === BackingStorageType.EXTERNAL &&
    !isRhcs
  ) {
    const systemName = createExternalSSName(displayName);
    const systemKind = getStorageSystemKind(model);
    return [createSSPayload(systemKind, systemName)];
  }

  if (stepName === StepsName(t)[Steps.ReviewAndCreate]) {
    if (deployment === DeploymentType.MCG) {
      const { apiGroup, apiVersion, kind } = OCSServiceModel;
      const systemName = 'odf-storage-system';
      const systemKind = getStorageSystemKind({ apiGroup, apiVersion, kind });
      return [createNoobaaPayload(), createSSPayload(systemKind, systemName)];
    }
    if (type === BackingStorageType.EXTERNAL) {
      const systemName = createExternalSSName(displayName);
      const systemKind = getStorageSystemKind(model);
      const secondParam = isRhcs ? connectionDetails : createStorageClass;
      const payloads = [
        ...createPayload(systemName, secondParam, model, storageClass.name),
        createSSPayload(systemKind, systemName),
      ];
      return !_.isEmpty(secondParam) && payloads;
    }
  }

  return null;
};

export const CreateStorageSystemFooter: React.FC<CreateStorageSystemFooterProps> = ({
  dispatch,
  state,
  disableNext,
}) => {
  const { t } = useTranslation();
  const { activeStep, onNext, onBack, onClose } = React.useContext<WizardContextType>(
    WizardContext,
  );
  const [requestInProgress, setRequestInProgress] = React.useState(false);
  const [requestError, setRequestError] = React.useState('');
  const [showErrorAlert, setShowErrorAlert] = React.useState(false);

  const stepId = activeStep.id as number;
  const stepName = activeStep.name as string;

  const jumpToNextStep = validateStep(stepName, state, t);

  const handleNext = async () => {
    const payloads = getPayloads(stepName, state, t);
    if (payloads !== null) {
      setRequestInProgress(true);
      try {
        const requests = payloads.map(({ model, payload }) => k8sCreate(model, payload));
        await Promise.all(requests);
        dispatch({
          type: 'wizard/setStepIdReached',
          payload: state.stepIdReached <= stepId ? stepId + 1 : state.stepIdReached,
        });
        onNext();
      } catch (err) {
        setRequestError(err.message);
        setShowErrorAlert(true);
      } finally {
        setRequestInProgress(false);
      }
    } else {
      dispatch({
        type: 'wizard/setStepIdReached',
        payload: state.stepIdReached <= stepId ? stepId + 1 : state.stepIdReached,
      });
      onNext();
    }
  };

  return (
    <>
      {showErrorAlert && (
        <Alert
          className="odf-create-storage-system-footer__alert"
          variant="danger"
          isInline
          actionClose={<AlertActionCloseButton onClose={() => setShowErrorAlert(false)} />}
          title={t('ceph-storage-plugin~An error has occurred')}
        >
          {requestError}
        </Alert>
      )}
      <WizardFooter>
        <Button
          isLoading={requestInProgress || null}
          isDisabled={disableNext || requestInProgress || !jumpToNextStep}
          variant="primary"
          type="submit"
          onClick={handleNext}
        >
          {stepName === StepsName(t)[Steps.ReviewAndCreate]
            ? t('ceph-storage-plugin~Create')
            : t('ceph-storage-plugin~Next')}
        </Button>
        {/* Disabling the back button for the first step (Backing storage) in wizard */}
        <Button
          variant="secondary"
          onClick={onBack}
          isDisabled={stepName === StepsName(t)[Steps.BackingStorage]}
        >
          {t('ceph-storage-plugin~Back')}
        </Button>
        <Button variant="link" onClick={onClose}>
          {t('ceph-storage-plugin~Cancel')}
        </Button>
      </WizardFooter>
    </>
  );
};

type CreateStorageSystemFooterProps = WizardCommonProps & {
  disableNext: boolean;
};
