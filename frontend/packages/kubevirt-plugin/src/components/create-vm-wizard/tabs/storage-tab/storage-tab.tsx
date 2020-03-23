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
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import { isStepLocked } from '../../selectors/immutable/wizard-selectors';
import { VMWizardProps, VMWizardStorageWithWrappers, VMWizardTab } from '../../types';
import { VMDisksTable } from '../../../vm-disks/vm-disks';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { iGetProvisionSource } from '../../selectors/immutable/vm-settings';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { diskTableColumnClasses } from '../../../vm-disks/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { isLoaded } from '../../../../utils';
import { DeviceType } from '../../../../constants/vm';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { VHW_TYPES } from '../virtual-hardware-tab/types';
import { VmWizardStorageRow } from './vm-wizard-storage-row';
import { VMWizardStorageBundle } from './types';
import { vmWizardStorageModalEnhanced } from './vm-wizard-storage-modal-enhanced';
import { StorageBootSource } from './storage-boot-source';
import { ADD_DISK } from '../../../../utils/strings';

import './storage-tab.scss';

const getStoragesData = (
  storages: VMWizardStorageWithWrappers[],
  pvcs: FirehoseResult<K8sResourceKind[]>,
): VMWizardStorageBundle[] => {
  const pvcLookup = createLookup(pvcs, getName);

  return storages
    .filter((storage) => !VHW_TYPES.has(storage.diskWrapper.getType()))
    .map((wizardStorageData) => {
      const {
        diskWrapper,
        volumeWrapper,
        dataVolumeWrapper,
        persistentVolumeClaimWrapper,
      } = wizardStorageData;
      const pvc = pvcLookup[volumeWrapper.getPersistentVolumeClaimName()];

      const combinedDisk = new CombinedDisk({
        diskWrapper,
        volumeWrapper,
        dataVolumeWrapper,
        persistentVolumeClaimWrapper:
          persistentVolumeClaimWrapper || (pvc && new PersistentVolumeClaimWrapper(pvc)),
        isNewPVC: !!persistentVolumeClaimWrapper,
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
  storages: VMWizardStorageWithWrappers[];
  removeStorage: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  onBootOrderChanged: (deviceID: string, bootOrder: number) => void;
  persistentVolumeClaims: FirehoseResult<K8sResourceKind[]>;
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
  storages: getStoragesWithWrappers(state, wizardReduxID),
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
