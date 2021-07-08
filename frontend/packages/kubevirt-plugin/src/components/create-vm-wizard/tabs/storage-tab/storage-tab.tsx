import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Bullseye,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateVariant,
  Split,
  SplitItem,
  Stack,
  StackItem,
  Title,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { ExternalLink, Firehose, FirehoseResult } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { createLookup, getName } from '@console/shared/src';
import { DeviceType } from '../../../../constants/vm';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { isLoaded } from '../../../../utils';
import {
  STORAGE_CLASS_SUPPORTED_RHV_LINK,
  STORAGE_CLASS_SUPPORTED_VMWARE_LINK,
} from '../../../../utils/strings';
import { wrapWithProgress } from '../../../../utils/utils';
import { diskTableColumnClasses } from '../../../vm-disks/utils';
import { VMDisksTable } from '../../../vm-disks/vm-disks';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetImportProvidersValue } from '../../selectors/immutable/import-providers';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
  isStepLocked,
} from '../../selectors/immutable/wizard-selectors';
import { getStorages } from '../../selectors/selectors';
import {
  ImportProvidersField,
  VMImportProvider,
  VMWizardProps,
  VMWizardStorage,
  VMWizardTab,
} from '../../types';
import { StorageBootSource } from './storage-boot-source';
import { VMWizardStorageBundle } from './types';
import { vmWizardStorageModalEnhanced } from './vm-wizard-storage-modal-enhanced';
import { VmWizardStorageRow } from './vm-wizard-storage-row';

import './storage-tab.scss';

const getStoragesData = (
  storages: VMWizardStorage[],
  pvcs: FirehoseResult,
): VMWizardStorageBundle[] => {
  const pvcLookup = createLookup(pvcs, getName);

  return storages.map((wizardStorageData) => {
    const { disk, volume, dataVolume, persistentVolumeClaim } = wizardStorageData;

    const pvc = pvcLookup[new VolumeWrapper(volume).getPersistentVolumeClaimName()];

    const combinedDisk = new CombinedDisk({
      disk,
      volume,
      dataVolume,
      persistentVolumeClaim: persistentVolumeClaim || pvc,
      isNewPVC: !!persistentVolumeClaim,
      pvcsLoading: !isLoaded(pvcs),
    });

    return {
      wizardStorageData,
      // for sorting
      name: combinedDisk.getName(),
      source: combinedDisk.getSourceValue(),
      diskInterface: combinedDisk.getDiskInterface(),
      size: combinedDisk.getReadableSize(),
      storageClass: combinedDisk.getStorageClassName(),
      type: combinedDisk.getType(),
    };
  });
};

const StorageTabFirehose: React.FC<StorageTabFirehoseProps> = ({
  wizardReduxID,
  isLocked,
  setTabLocked,
  isBootDiskRequired,
  removeStorage,
  onBootOrderChanged,
  storages,
  persistentVolumeClaims,
  isCreateDisabled,
  isUpdateDisabled,
  isDeleteDisabled,
  importProvider,
}) => {
  const { t } = useTranslation();

  const showStorages = storages.length > 0 || isBootDiskRequired;

  const withProgress = wrapWithProgress(setTabLocked);

  const addButtonProps = {
    id: 'add-disk',
    onClick: () =>
      withProgress(
        vmWizardStorageModalEnhanced({
          blocking: true,
          wizardReduxID,
        }).result,
      ),
    isDisabled: isLocked,
  };

  return (
    <div className="kubevirt-create-vm-modal__storage-tab-container">
      <Stack hasGutter>
        {importProvider && (
          <StackItem>
            <Alert
              variant={AlertVariant.warning}
              isInline
              title={t('kubevirt-plugin~Supported Storage classes')}
            >
              <ExternalLink
                text={t('kubevirt-plugin~Supported Storage classes for selected provider')}
                href={
                  importProvider === VMImportProvider.OVIRT
                    ? STORAGE_CLASS_SUPPORTED_RHV_LINK
                    : STORAGE_CLASS_SUPPORTED_VMWARE_LINK
                }
              />
            </Alert>
          </StackItem>
        )}
        <StackItem>
          <Split>
            <SplitItem isFilled>
              <Title headingLevel="h5" size="lg">
                {t('kubevirt-plugin~Disks')}
              </Title>
            </SplitItem>
            {showStorages && !isCreateDisabled && (
              <SplitItem>
                <Button {...addButtonProps} variant={ButtonVariant.secondary}>
                  {t('kubevirt-plugin~Add Disk')}
                </Button>
              </SplitItem>
            )}
          </Split>
          {showStorages && (
            <>
              <VMDisksTable
                data={getStoragesData(storages, persistentVolumeClaims)}
                customData={{
                  isDisabled: isLocked,
                  withProgress,
                  removeStorage,
                  wizardReduxID,
                  isDeleteDisabled,
                  isUpdateDisabled,
                  columnClasses: diskTableColumnClasses,
                }}
                Row={VmWizardStorageRow}
                loaded
              />
              {isBootDiskRequired && (
                <StorageBootSource
                  className="kubevirt-create-vm-modal__storage-tab-boot-select"
                  isDisabled={isLocked}
                  storages={storages}
                  onBootOrderChanged={onBootOrderChanged}
                />
              )}
            </>
          )}
          {!showStorages && (
            <Bullseye>
              <EmptyState variant={EmptyStateVariant.full}>
                <Title headingLevel="h5" size="lg">
                  {t('kubevirt-plugin~No disks attached')}
                </Title>
                {!isCreateDisabled && (
                  <Button
                    {...addButtonProps}
                    icon={<PlusCircleIcon />}
                    variant={ButtonVariant.link}
                  >
                    {t('kubevirt-plugin~Add Disk')}
                  </Button>
                )}
              </EmptyState>
            </Bullseye>
          )}
        </StackItem>
      </Stack>
    </div>
  );
};

type StorageTabFirehoseProps = {
  isLocked: boolean;
  isBootDiskRequired: boolean;
  wizardReduxID: string;
  storages: VMWizardStorage[];
  removeStorage: (id: string) => void;
  isCreateDisabled: boolean;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
  setTabLocked: (isLocked: boolean) => void;
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  persistentVolumeClaims?: FirehoseResult;
  importProvider?: VMImportProvider;
};

const StorageTabConnected: React.FC<StorageTabConnectedProps> = ({ namespace, ...rest }) => (
  <Firehose
    resources={[
      {
        kind: PersistentVolumeClaimModel.kind,
        isList: true,
        namespace,
        prop: 'persistentVolumeClaims',
      },
    ]}
  >
    <StorageTabFirehose {...rest} />
  </Firehose>
);

type StorageTabConnectedProps = StorageTabFirehoseProps & {
  namespace: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
  isLocked: isStepLocked(state, wizardReduxID, VMWizardTab.STORAGE),
  isCreateDisabled: hasStepCreateDisabled(state, wizardReduxID, VMWizardTab.STORAGE),
  isUpdateDisabled: hasStepUpdateDisabled(state, wizardReduxID, VMWizardTab.STORAGE),
  isDeleteDisabled: hasStepDeleteDisabled(state, wizardReduxID, VMWizardTab.STORAGE),
  storages: getStorages(state, wizardReduxID),
  isBootDiskRequired: iGetProvisionSource(state, wizardReduxID) !== ProvisionSource.PXE,
  importProvider: iGetImportProvidersValue(state, wizardReduxID, ImportProvidersField.PROVIDER),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](wizardReduxID, VMWizardTab.STORAGE, isLocked),
    );
  },
  removeStorage: (id: string) => {
    dispatch(vmWizardActions[ActionType.RemoveStorage](wizardReduxID, id));
  },
  onBootOrderChanged: (deviceID: string, bootOrder: number) => {
    dispatch(
      vmWizardActions[ActionType.SetDeviceBootOrder](
        wizardReduxID,
        deviceID,
        DeviceType.DISK,
        bootOrder,
      ),
    );
  },
});

export const StorageTab = connect(stateToProps, dispatchToProps)(StorageTabConnected);
