import * as React from 'react';
import { connect } from 'react-redux';
import { Title } from '@patternfly/react-core';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import {
  hasStepCreateDisabled,
  hasStepDeleteDisabled,
  hasStepUpdateDisabled,
  isStepLocked,
} from '../../selectors/immutable/wizard-selectors';
import { VMWizardProps, VMWizardTab, VMWizardStorageType, VMWizardStorage } from '../../types';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getStorages } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { cdTableColumnClasses } from '../../../vm-disks/utils';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { isLoaded } from '../../../../utils';
import { ATTACH_CD } from '../../strings/storage';
import { DiskType } from '../../../../constants/vm';
import { getAvailableCDName } from '../../../modals/cdrom-vm-modal/helpers';
import { VMWizardStorageBundle } from '../storage-tab/types';
import { vmWizardStorageModalEnhanced } from '../storage-tab/vm-wizard-storage-modal-enhanced';
import { VMCDsTable } from '../../../vm-disks/vm-cds';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VHW_TYPES } from './types';
import { VmWizardVirtualHardwareRow } from './vm-wizard-virtualhardware-row';
import './virtual-hardware-tab.scss';
import { getTemplateValidation } from '../../selectors/template';
import { TemplateValidations } from 'packages/kubevirt-plugin/src/utils/validations/template/template-validations';
import { AddCDButton } from '../../../modals/cdrom-vm-modal/cdrom-modal';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';

const getVirtualStoragesData = (
  storages: VMWizardStorage[],
  pvcs: FirehoseResult,
): VMWizardStorageBundle[] => {
  const pvcLookup = createLookup(pvcs, getName);

  return storages
    .filter((storage) => VHW_TYPES.has(new DiskWrapper(storage.disk).getType()))
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
        source: combinedDisk.getCDROMSourceValue(),
        content: combinedDisk.getContent(),
        diskInterface: combinedDisk.getDiskInterface(),
        storageClass: combinedDisk.getStorageClassName(),
      };
    });
};

const VirtualHardwareTabFirehose: React.FC<VirtualHardwareTabFirehoseProps> = ({
  wizardReduxID,
  isLocked,
  setTabLocked,
  removeStorage,
  storages,
  templateValidations,
  persistentVolumeClaims,
  isCreateDisabled,
  isUpdateDisabled,
  isDeleteDisabled,
}) => {
  const virtualStorages = getVirtualStoragesData(storages, persistentVolumeClaims);
  const showStorages = virtualStorages.length > 0;
  const isMaxCDsReached = virtualStorages.length > 1;
  const disableAddCD = isLocked || isCreateDisabled || isMaxCDsReached;
  const withProgress = wrapWithProgress(setTabLocked);

  const addButton = (
    <AddCDButton
      className="virtual-hardware-tab-add-btn"
      text={ATTACH_CD}
      isDisabled={disableAddCD}
      isMaxCDsReached={isMaxCDsReached}
      onClick={() => {
        const availableCDName = getAvailableCDName(storages.map((storage) => storage.disk));
        const diskWrapper = new DiskWrapper()
          .init({
            name: availableCDName,
          })
          .setType(DiskType.CDROM, { bus: templateValidations.getDefaultBus(DiskType.CDROM) });

        withProgress(
          vmWizardStorageModalEnhanced({
            storage: {
              disk: diskWrapper.asResource(),
              type: VMWizardStorageType.UI_INPUT,
            },
            blocking: true,
            wizardReduxID,
          }).result,
        );
      }}
    />
  );

  return (
    <div className="kubevirt-create-vm-modal__virtual-hardware-tab-container">
      <Title headingLevel="h5" size="lg">
        Virtual Hardware
      </Title>
      <Title className="virtual-hardware-tab-cd-title" headingLevel="h4" size="md">
        CD-ROMs
      </Title>
      {showStorages && (
        <>
          <div className="virtual-hardware-tab-main">
            <VMCDsTable
              columnClasses={cdTableColumnClasses}
              data={virtualStorages}
              customData={{
                isDisabled: isLocked,
                withProgress,
                removeStorage,
                wizardReduxID,
                isDeleteDisabled,
                isUpdateDisabled,
              }}
              row={VmWizardVirtualHardwareRow}
            />
            {addButton}
          </div>
        </>
      )}
      {!showStorages && (
        <div className="virtual-hardware-tab-empty-state">
          <Title headingLevel="h2" size="md">
            There are no CD-ROMs currently attached.
          </Title>
          {addButton}
        </div>
      )}
    </div>
  );
};

type VirtualHardwareTabFirehoseProps = {
  isLocked: boolean;
  isBootDiskRequired: boolean;
  wizardReduxID: string;
  storages: VMWizardStorage[];
  templateValidations: TemplateValidations;
  isCreateDisabled: boolean;
  isUpdateDisabled: boolean;
  isDeleteDisabled: boolean;
  removeStorage: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  persistentVolumeClaims: FirehoseResult;
};

const VirtualHardwareConnected: React.FC<VirtualHardwareConnectedProps> = ({
  namespace,
  ...rest
}) => (
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
    <VirtualHardwareTabFirehose {...rest} />
  </Firehose>
);

type VirtualHardwareConnectedProps = VirtualHardwareTabFirehoseProps & {
  namespace: string;
};

const stateToProps = (state, { wizardReduxID }) => ({
  namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
  isLocked: isStepLocked(state, wizardReduxID, VMWizardTab.ADVANCED_VIRTUAL_HARDWARE),
  isCreateDisabled: hasStepCreateDisabled(
    state,
    wizardReduxID,
    VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
  ),
  isUpdateDisabled: hasStepUpdateDisabled(
    state,
    wizardReduxID,
    VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
  ),
  isDeleteDisabled: hasStepDeleteDisabled(
    state,
    wizardReduxID,
    VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
  ),
  storages: getStorages(state, wizardReduxID),
  templateValidations: getTemplateValidation(state, wizardReduxID),
});

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  setTabLocked: (isLocked) => {
    dispatch(
      vmWizardActions[ActionType.SetTabLocked](
        wizardReduxID,
        VMWizardTab.ADVANCED_VIRTUAL_HARDWARE,
        isLocked,
      ),
    );
  },
  removeStorage: (id: string) => {
    dispatch(vmWizardActions[ActionType.RemoveStorage](wizardReduxID, id));
  },
});

export const VirtualHardwareTab = connect(stateToProps, dispatchToProps)(VirtualHardwareConnected);
