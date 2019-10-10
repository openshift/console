import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  ProjectModel,
  StorageClassModel,
} from '@console/internal/models';
import { iGetCommonData } from '../../selectors/immutable/selectors';
import {
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
  VMWizardStorageWithWrappers,
} from '../../types';
import { vmWizardActions } from '../../redux/actions';
import { ActionType } from '../../redux/types';
import { getStoragesWithWrappers } from '../../selectors/selectors';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskModal } from '../../../modals/disk-modal';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';

const VMWizardNICModal: React.FC<VMWizardStorageModalProps> = (props) => {
  const {
    id,
    type,
    namespace: vmNamespace,
    useProjects,
    addUpdateStorage,
    storages,
    diskWrapper = DiskWrapper.EMPTY,
    volumeWrapper = VolumeWrapper.EMPTY,
    dataVolumeWrapper,
    ...restProps
  } = props;
  const filteredStorages = storages.filter(
    (storage) =>
      storage &&
      storage.diskWrapper.getName() &&
      storage.diskWrapper.getName() !== diskWrapper.getName(),
  );

  const usedDiskNames: Set<string> = new Set(
    filteredStorages.map(({ diskWrapper: dw }) => dw.getName()),
  );

  const usedPVCNames: Set<string> = new Set(
    filteredStorages
      .filter(({ dataVolume }) => dataVolume)
      .map(({ dataVolumeWrapper: dvw }) => dvw.getName()),
  );

  const [namespace, setNamespace] = React.useState<string>(vmNamespace);

  const resources = [
    {
      kind: (useProjects ? ProjectModel : NamespaceModel).kind,
      isList: true,
      prop: 'namespaces',
    },
    {
      kind: StorageClassModel.kind,
      isList: true,
      prop: 'storageClasses',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'persistentVolumeClaims',
    },
  ];

  return (
    <Firehose resources={resources}>
      <DiskModal
        {...restProps}
        vmName={VM_TEMPLATE_NAME_PARAMETER}
        vmNamespace={vmNamespace}
        namespace={namespace}
        onNamespaceChanged={(n) => setNamespace(n)}
        usedDiskNames={usedDiskNames}
        usedPVCNames={usedPVCNames}
        disk={diskWrapper}
        volume={volumeWrapper}
        dataVolume={dataVolumeWrapper}
        disableSourceChange={[
          VMWizardStorageType.PROVISION_SOURCE_DISK,
          VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
        ].includes(type)}
        onSubmit={(resultDiskWrapper, resultVolumeWrapper, resultDataVolumeWrapper) => {
          addUpdateStorage({
            id,
            type: type || VMWizardStorageType.UI_INPUT,
            disk: DiskWrapper.mergeWrappers(diskWrapper, resultDiskWrapper).asResource(),
            volume: VolumeWrapper.mergeWrappers(volumeWrapper, resultVolumeWrapper).asResource(),
            dataVolume:
              resultDataVolumeWrapper &&
              DataVolumeWrapper.mergeWrappers(
                dataVolumeWrapper,
                resultDataVolumeWrapper,
              ).asResource(),
          });
          return Promise.resolve();
        }}
      />
    </Firehose>
  );
};

type VMWizardStorageModalProps = ModalComponentProps & {
  id?: string;
  namespace: string;
  useProjects?: boolean;
  type?: VMWizardStorageType;
  diskWrapper?: DiskWrapper;
  volumeWrapper?: VolumeWrapper;
  dataVolumeWrapper?: DataVolumeWrapper;
  storages: VMWizardStorageWithWrappers[];
  addUpdateStorage: (storage: VMWizardStorage) => void;
};

const stateToProps = (state, { wizardReduxID }) => {
  const useProjects = state.k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
    storages: getStoragesWithWrappers(state, wizardReduxID),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  addUpdateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](wizardReduxID, storage));
  },
});

const VMWizardStorageModalConnected = connect(
  stateToProps,
  dispatchToProps,
)(VMWizardNICModal);

export const vmWizardStorageModalEnhanced = createModalLauncher(VMWizardStorageModalConnected);
