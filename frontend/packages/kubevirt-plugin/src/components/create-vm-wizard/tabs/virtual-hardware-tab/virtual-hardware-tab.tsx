import * as React from 'react';
import { connect } from 'react-redux';
import { Title } from '@patternfly/react-core';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createLookup, getName } from '@console/shared/src';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { iGetCommonData, iGetCreateVMWizardTabs } from '../../selectors/immutable/selectors';
import { isStepLocked } from '../../selectors/immutable/wizard-selectors';
import {
  VMWizardProps,
  VMWizardStorageWithWrappers,
  VMWizardTab,
  VMWizardStorageType,
} from '../../types';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { wrapWithProgress } from '../../../../utils/utils';
import { cdTableColumnClasses } from '../../../vm-disks/utils';
import { CombinedDisk } from '../../../../k8s/wrapper/vm/combined-disk';
import { isLoaded } from '../../../../utils';
import { ATTACH_CD } from '../../strings/storage';
import { DiskType } from '../../../../constants/vm';
import { getAvailableCDName } from '../../../modals/cdrom-vm-modal/helpers';
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
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

const getVirtualStoragesData = (
  storages: VMWizardStorageWithWrappers[],
  pvcs: FirehoseResult<K8sResourceKind[]>,
): VMWizardStorageBundle[] => {
  const pvcLookup = createLookup(pvcs, getName);

  return storages
    .filter((storage) => VHW_TYPES.has(storage.diskWrapper.getType()))
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
          persistentVolumeClaimWrapper || (pvc && PersistentVolumeClaimWrapper.initialize(pvc)),
        isNewPVC: !!persistentVolumeClaimWrapper,
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
}) => {
  const virtualStorages = getVirtualStoragesData(storages, persistentVolumeClaims);
  const showStorages = virtualStorages.length > 0;
  const disableAddCD = isLocked || virtualStorages.length > 1;
  const availableCDName = getAvailableCDName(storages.map((storage) => storage.disk));
  const withProgress = wrapWithProgress(setTabLocked);
  const diskWrapper = DiskWrapper.initializeFromSimpleData({
    name: availableCDName,
    type: DiskType.CDROM,
    bus: templateValidations.getDefaultBus(DiskType.CDROM),
  });

  const addButton = (
    <AddCDButton
      className="virtual-hardware-tab-add-btn"
      text={ATTACH_CD}
      isDisabled={disableAddCD}
      onClick={() =>
        withProgress(
          vmWizardStorageModalEnhanced({
            storage: {
              diskWrapper,
              type: VMWizardStorageType.UI_INPUT,
            },
            blocking: true,
            wizardReduxID,
          }).result,
        )
      }
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
              customData={{ isDisabled: isLocked, withProgress, removeStorage, wizardReduxID }}
              row={VmWizardVirtualHardwareRow}
            />
            {addButton}
          </div>
        </>
      )}
      {!showStorages && (
        <div className="virtual-hardware-tab-empty-state">
          <Title size="sm">There are no CD-ROMs currently attached.</Title>
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
  storages: VMWizardStorageWithWrappers[];
  templateValidations: TemplateValidations;
  removeStorage: (id: string) => void;
  setTabLocked: (isLocked: boolean) => void;
  persistentVolumeClaims: FirehoseResult<K8sResourceKind[]>;
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

const stateToProps = (state, { wizardReduxID }) => {
  const stepData = iGetCreateVMWizardTabs(state, wizardReduxID);
  return {
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
    isLocked: isStepLocked(stepData, VMWizardTab.ADVANCED_VIRTUAL_HARDWARE),
    storages: getStoragesWithWrappers(state, wizardReduxID),
    templateValidations: getTemplateValidation(state, wizardReduxID),
  };
};

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
