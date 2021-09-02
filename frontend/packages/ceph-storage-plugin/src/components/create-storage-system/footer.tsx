import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import {
  WizardFooter,
  Button,
  WizardContext,
  WizardContextType,
  Alert,
  AlertActionCloseButton,
} from '@patternfly/react-core';
import { history } from '@console/internal/components/utils';
import { OCS_ATTACHED_DEVICES_FLAG } from '@console/local-storage-operator-plugin/src/features';
import { setFlag } from '@console/internal/actions/features';
import { WizardCommonProps, WizardState } from './reducer';
import {
  createExternalSubSystem,
  createMCGStorageCluster,
  createStorageCluster,
  createStorageSystem,
  labelNodes,
} from './payloads';
import {
  BackingStorageType,
  DeploymentType,
  Steps,
  StepsName,
  STORAGE_CLUSTER_SYSTEM_KIND,
} from '../../constants/create-storage-system';
import { OCSServiceModel } from '../../models';
import './create-storage-system.scss';
import {
  getExternalStorage,
  getStorageSystemKind,
  getExternalSubSystemName,
} from '../../utils/create-storage-system';
import { MINIMUM_NODES, OCS_EXTERNAL_CR_NAME, OCS_INTERNAL_CR_NAME } from '../../constants';
import { NetworkType, StorageSystemKind } from '../../types';
import { labelOCSNamespace } from '../ocs-install/ocs-request-data';
import { createClusterKmsResources } from '../kms-config/utils';
import { OCS_CONVERGED_FLAG, OCS_INDEPENDENT_FLAG, OCS_FLAG } from '../../features';

const validateBackingStorageStep = (backingStorage, sc) => {
  const { type, externalStorage, deployment } = backingStorage;
  switch (type) {
    case BackingStorageType.EXISTING:
      return !!sc.name || deployment === DeploymentType.MCG;
    case BackingStorageType.EXTERNAL:
      return !!externalStorage;
    case BackingStorageType.LOCAL_DEVICES:
      return true;
    default:
      return false;
  }
};

const canJumpToNextStep = (name: string, state: WizardState, t: TFunction) => {
  const {
    storageClass,
    backingStorage,
    createStorageClass,
    capacityAndNodes,
    createLocalVolumeSet,
    securityAndNetwork,
    nodes,
  } = state;
  const { externalStorage } = backingStorage;
  const { capacity } = capacityAndNodes;
  const { chartNodes, volumeSetName, isValidDiskSize } = createLocalVolumeSet;
  const { encryption, kms, networkType, publicNetwork, clusterNetwork } = securityAndNetwork;
  const { canGoToNextStep } = getExternalStorage(externalStorage) || {};

  const hasConfiguredNetwork =
    networkType === NetworkType.MULTUS ? !!(publicNetwork || clusterNetwork) : true;

  switch (name) {
    case StepsName(t)[Steps.BackingStorage]:
      return validateBackingStorageStep(backingStorage, storageClass);
    case StepsName(t)[Steps.CreateStorageClass]:
      return (
        !!storageClass.name &&
        canGoToNextStep &&
        canGoToNextStep(createStorageClass, storageClass.name)
      );
    case StepsName(t)[Steps.ConnectionDetails]:
      return canGoToNextStep && canGoToNextStep(createStorageClass, storageClass.name);
    case StepsName(t)[Steps.CreateLocalVolumeSet]:
      return chartNodes.size >= MINIMUM_NODES && volumeSetName.trim().length && isValidDiskSize;
    case StepsName(t)[Steps.CapacityAndNodes]:
      return nodes.length >= MINIMUM_NODES && capacity;
    case StepsName(t)[Steps.SecurityAndNetwork]:
      return encryption.hasHandled && kms.hasHandled && hasConfiguredNetwork;
    case StepsName(t)[Steps.Security]:
      return encryption.hasHandled && kms.hasHandled;
    case StepsName(t)[Steps.ReviewAndCreate]:
      return true;
    default:
      return false;
  }
};

export const setActionFlags = (
  type: WizardState['backingStorage']['type'],
  flagDispatcher: any,
  isRhcs: boolean,
) => {
  switch (type) {
    case BackingStorageType.EXISTING:
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, true));
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, false));
      flagDispatcher(setFlag(OCS_FLAG, true));
      break;
    case BackingStorageType.EXTERNAL:
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, isRhcs));
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, !isRhcs));
      flagDispatcher(setFlag(OCS_FLAG, true));
      break;
    case BackingStorageType.LOCAL_DEVICES:
      flagDispatcher(setFlag(OCS_ATTACHED_DEVICES_FLAG, true));
      flagDispatcher(setFlag(OCS_CONVERGED_FLAG, true));
      flagDispatcher(setFlag(OCS_INDEPENDENT_FLAG, false));
      flagDispatcher(setFlag(OCS_FLAG, true));
      break;
    default:
  }
};

const handleBackingStorageNext = async (
  backingStorage: WizardState['backingStorage'],
  handleError: (err: string) => void,
  storageSystems: StorageSystemKind[] = [],
  moveToNextStep: () => void,
) => {
  const { externalStorage, type, deployment } = backingStorage;
  const { model, displayName } = getExternalStorage(externalStorage) || {
    model: { kind: '', apiVersion: '', apiGroup: '' },
    displayName: '',
  };
  const isSSPresent = storageSystems.find((ss) => ss.spec.kind === model.kind);
  const isRhcs = externalStorage === OCSServiceModel.kind;

  try {
    /*
     * Creating storage system for an external vendor other than RHCS.
     * The created storage system will create a subscription for
     * external vendor operator.
     */
    if (
      type === BackingStorageType.EXTERNAL &&
      !isRhcs &&
      !isSSPresent &&
      deployment !== DeploymentType.MCG
    ) {
      const subSystemName = getExternalSubSystemName(displayName);
      const externalSystemKind = getStorageSystemKind(model);
      await createStorageSystem(subSystemName, externalSystemKind);
      moveToNextStep();
    } else moveToNextStep();
  } catch (err) {
    handleError(err.message);
  }
};

const handleReviewAndCreateNext = async (
  state: WizardState,
  hasOCS: boolean,
  handleError: (err: string) => void,
  flagDispatcher: any,
) => {
  const { connectionDetails, createStorageClass, storageClass, nodes } = state;
  const { externalStorage, deployment, type } = state.backingStorage;
  const { encryption, kms } = state.securityAndNetwork;
  const isRhcs: boolean = externalStorage === OCSServiceModel.kind;
  const isMCG: boolean = deployment === DeploymentType.MCG;

  try {
    if (isMCG) {
      await labelOCSNamespace();
      if (encryption.advanced) await Promise.all(createClusterKmsResources(kms));
      await createMCGStorageCluster(encryption.advanced);
    } else if (type === BackingStorageType.EXISTING || type === BackingStorageType.LOCAL_DEVICES) {
      await labelOCSNamespace();
      await labelNodes(nodes);
      if (encryption.advanced) await Promise.all(createClusterKmsResources(kms));
      await createStorageSystem(OCS_INTERNAL_CR_NAME, STORAGE_CLUSTER_SYSTEM_KIND);
      await createStorageCluster(state);
    } else if (type === BackingStorageType.EXTERNAL) {
      const { createPayload, model, displayName } = getExternalStorage(externalStorage) || {};

      const subSystemName = isRhcs ? OCS_EXTERNAL_CR_NAME : getExternalSubSystemName(displayName);
      const subSystemState = isRhcs ? connectionDetails : createStorageClass;
      const subSystemPayloads = createPayload(
        subSystemName,
        subSystemState,
        model,
        storageClass.name,
      );

      await createExternalSubSystem(subSystemPayloads);
      if (!hasOCS) await createStorageCluster(state);
    }
    // These flags control the enablement of dashboards and other ODF UI components in console
    setActionFlags(isMCG ? BackingStorageType.EXISTING : type, flagDispatcher, isRhcs);
    history.push('/odf/systems');
  } catch (err) {
    handleError(err.message);
  }
};

export const CreateStorageSystemFooter: React.FC<CreateStorageSystemFooterProps> = ({
  dispatch,
  state,
  disableNext,
  hasOCS,
  storageSystems,
}) => {
  const { t } = useTranslation();
  const { activeStep, onNext, onBack } = React.useContext<WizardContextType>(WizardContext);
  const [requestInProgress, setRequestInProgress] = React.useState(false);
  const [requestError, setRequestError] = React.useState('');
  const [showErrorAlert, setShowErrorAlert] = React.useState(false);
  const flagDispatcher = useDispatch();

  const stepId = activeStep.id as number;
  const stepName = activeStep.name as string;

  const jumpToNextStep = canJumpToNextStep(stepName, state, t);

  const moveToNextStep = () => {
    dispatch({
      type: 'wizard/setStepIdReached',
      payload: state.stepIdReached <= stepId ? stepId + 1 : state.stepIdReached,
    });
    onNext();
  };

  const handleError = (errorMessage: string) => {
    setRequestError(errorMessage);
    setShowErrorAlert(true);
  };

  const handleNext = async () => {
    switch (stepName) {
      case StepsName(t)[Steps.BackingStorage]:
        setRequestInProgress(true);
        await handleBackingStorageNext(
          state.backingStorage,
          handleError,
          storageSystems,
          moveToNextStep,
        );
        setRequestInProgress(false);
        break;
      case StepsName(t)[Steps.CreateLocalVolumeSet]:
        dispatch({
          type: 'wizard/setCreateLocalVolumeSet',
          payload: { field: 'showConfirmModal', value: true },
        });
        break;
      case StepsName(t)[Steps.ReviewAndCreate]:
        setRequestInProgress(true);
        await handleReviewAndCreateNext(state, hasOCS, handleError, flagDispatcher);
        setRequestInProgress(false);
        break;
      default:
        moveToNextStep();
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
        <Button variant="link" onClick={history.goBack}>
          {t('ceph-storage-plugin~Cancel')}
        </Button>
      </WizardFooter>
    </>
  );
};

type CreateStorageSystemFooterProps = WizardCommonProps & {
  disableNext: boolean;
  hasOCS: boolean;
  storageSystems: StorageSystemKind[];
};
