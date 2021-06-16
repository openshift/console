import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  WizardFooter,
  Button,
  WizardContext,
  WizardContextType,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { k8sCreate } from '@console/internal/module/k8s';
import { WizardCommonProps } from './reducer';
import { createSSPayload } from './payloads';
import { BackingStorageType, StepsId, RHCS } from '../../constants/create-storage-system';
import { StorageSystemModel } from '../../models';
import './create-storage-system.scss';
import { ODF_EXTERNAL_PROVIDERS } from '../../odf-external-providers/external-providers';

const validateBackingStorageStep = (bsType, sc, externalProvider) => {
  switch (bsType) {
    case BackingStorageType.EXISTING:
      return !!sc;
    case BackingStorageType.EXTERNAL:
      return !!externalProvider;
    case BackingStorageType.LOCAL_DEVICES:
      return true;
    default:
      return false;
  }
};

const validateStep = (id, state) => {
  const { storageClass, backingStorage } = state;
  const { type, externalProvider } = backingStorage;
  switch (id) {
    case StepsId.BackingStorage:
      return validateBackingStorageStep(type, storageClass, externalProvider);
    case StepsId.CreateLocalVolumeSet:
    case StepsId.CapacityAndNodes:
    case StepsId.ConnectionDetails:
    case StepsId.CreateStorageClass:
    case StepsId.ReviewAndCreate:
    case StepsId.SecurityAndNetwork:
      return true;
    default:
      return false;
  }
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

  const { backingStorage } = state;
  const { externalProvider } = backingStorage;

  const { id } = activeStep;

  const jumpToNextStep = validateStep(id, state);

  const handleNext = async () => {
    if (id === StepsId.BackingStorage && externalProvider !== RHCS) {
      setRequestInProgress(true);
      const { kind, id: providerID } =
        ODF_EXTERNAL_PROVIDERS.find((p) => p.id === externalProvider) || {};
      const payload = createSSPayload(kind, providerID);
      try {
        await k8sCreate(StorageSystemModel, payload);
        dispatch({
          type: 'currentStep/incrementCount',
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
        type: 'currentStep/incrementCount',
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
          {id === StepsId.ReviewAndCreate
            ? t('ceph-storage-plugin~Create')
            : t('ceph-storage-plugin~Next')}
        </Button>
        {/* Disabling the back button for the first step (Backing storage) in wizard */}
        <Button variant="secondary" onClick={onBack} isDisabled={id === StepsId.BackingStorage}>
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
