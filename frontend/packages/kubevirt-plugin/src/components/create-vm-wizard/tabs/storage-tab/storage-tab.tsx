import * as React from 'react';
import { connect } from 'react-redux';
import {
  Bullseye,
  Button,
  ButtonVariant,
  EmptyState,
  EmptyStateVariant,
  Split,
  SplitItem,
  Title,
} from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { isStepLocked } from '../../selectors/immutable/wizard-selectors';
import { VMWizardProps, VMWizardStorage, VMWizardTab } from '../../types';
import { VMDisksTable } from '../../../vm-disks/vm-disks';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getStorages } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { diskTableColumnClasses } from '../../../vm-disks/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { isLoaded } from '../../../../utils';
import { DeviceType } from '../../../../constants/vm';
import { VHW_TYPES } from '../virtual-hardware-tab/types';
import { VmWizardStorageRow } from './vm-wizard-storage-row';
import { VMWizardStorageBundle } from './types';
import { vmWizardStorageModalEnhanced } from './vm-wizard-storage-modal-enhanced';
import { StorageBootSource } from './storage-boot-source';
import { ADD_DISK } from '../../../../utils/strings';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';

import './storage-tab.scss';

const getStoragesData = (
  storages: VMWizardStorage[],
  pvcs: FirehoseResult,
): VMWizardStorageBundle[] => {
  const pvcLookup = createLookup(pvcs, getName);

  return storages
    .filter((storage) => !VHW_TYPES.has(new DiskWrapper(storage.disk).getType()))
    .map((wizardStorageData) => {
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
}) => {
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
      <Split>
        <SplitItem isFilled>
          <Title headingLevel="h5" size="lg">
            Disks
          </Title>
        </SplitItem>
        {showStorages && (
          <SplitItem>
            <Button {...addButtonProps} variant={ButtonVariant.secondary}>
              {ADD_DISK}
            </Button>
          </SplitItem>
        )}
      </Split>
      {showStorages && (
        <>
          <VMDisksTable
            columnClasses={diskTableColumnClasses}
            data={getStoragesData(storages, persistentVolumeClaims)}
            customData={{ isDisabled: isLocked, withProgress, removeStorage, wizardReduxID }}
            row={VmWizardStorageRow}
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
              No disks attached
            </Title>
            <Button {...addButtonProps} icon={<PlusCircleIcon />} variant={ButtonVariant.link}>
              {ADD_DISK}
            </Button>
          </EmptyState>
        </Bullseye>
      )}
    </div>
  );
};

type StorageTabFirehoseProps = {
  isLocked: boolean;
  isBootDiskRequired: boolean;
  wizardReduxID: string;
  storages: VMWizardStorage[];
  removeStorage: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  persistentVolumeClaims: FirehoseResult;
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
  storages: getStorages(state, wizardReduxID),
  isBootDiskRequired: iGetProvisionSource(state, wizardReduxID) === ProvisionSource.DISK,
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
