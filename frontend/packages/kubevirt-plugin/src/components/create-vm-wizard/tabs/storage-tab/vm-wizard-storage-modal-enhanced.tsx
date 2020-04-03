import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
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
import { PersistentVolumeClaimWrapper } from '../../../../k8s/wrapper/vm/persistent-volume-claim-wrapper';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { getTemplateValidation } from '../../selectors/template';
import { ConfigMapKind } from '@console/internal/module/k8s';
import { toShallowJS } from '../../../../utils/immutable';

const VMWizardStorageModal: React.FC<VMWizardStorageModalProps> = (props) => {
  const {
    storage,
    isCreateTemplate,
    isEditing,
    namespace: vmNamespace,
    useProjects,
    addUpdateStorage,
    storages,
    templateValidations,
    storageClassConfigMap,
    ...restProps
  } = props;
  const {
    type,
    diskWrapper,
    volumeWrapper,
    dataVolumeWrapper,
    persistentVolumeClaimWrapper,
    ...storageRest
  } = storage || {};

  const filteredStorages = storages.filter(
    (s) => s && s.diskWrapper.getName() && s.diskWrapper.getName() !== diskWrapper?.getName(),
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
        storageClassConfigMap={storageClassConfigMap}
        vmName={VM_TEMPLATE_NAME_PARAMETER}
        vmNamespace={vmNamespace}
        namespace={namespace}
        onNamespaceChanged={(n) => setNamespace(n)}
        usedDiskNames={usedDiskNames}
        usedPVCNames={usedPVCNames}
        templateValidations={templateValidations}
        disk={new DiskWrapper(diskWrapper, true)}
        volume={new VolumeWrapper(volumeWrapper, true)}
        dataVolume={dataVolumeWrapper && new DataVolumeWrapper(dataVolumeWrapper, true)}
        persistentVolumeClaim={
          persistentVolumeClaimWrapper &&
          new PersistentVolumeClaimWrapper(persistentVolumeClaimWrapper, true)
        }
        disableSourceChange={[
          VMWizardStorageType.PROVISION_SOURCE_DISK,
          VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
        ].includes(type)}
        isCreateTemplate={isCreateTemplate}
        isEditing={isEditing}
        onSubmit={(
          resultDiskWrapper,
          resultVolumeWrapper,
          resultDataVolumeWrapper,
          resultPersistentVolumeClaim,
        ) => {
          addUpdateStorage({
            ...storageRest,
            type: type || VMWizardStorageType.UI_INPUT,
            disk: new DiskWrapper(diskWrapper, true).mergeWith(resultDiskWrapper).asResource(),
            volume: new VolumeWrapper(volumeWrapper, true)
              .mergeWith(resultVolumeWrapper)
              .asResource(),
            dataVolume:
              resultDataVolumeWrapper &&
              new DataVolumeWrapper(dataVolumeWrapper, true)
                .mergeWith(resultDataVolumeWrapper)
                .asResource(),
            persistentVolumeClaim:
              resultPersistentVolumeClaim &&
              new PersistentVolumeClaimWrapper(persistentVolumeClaimWrapper, true)
                .mergeWith(resultPersistentVolumeClaim)
                .asResource(),
          });
          return Promise.resolve();
        }}
      />
    </Firehose>
  );
};

type VMWizardStorageModalProps = ModalComponentProps & {
  isEditing?: boolean;
  storage?: VMWizardStorageWithWrappers;
  namespace: string;
  useProjects?: boolean;
  isCreateTemplate: boolean;
  storageClassConfigMap: FirehoseResult<ConfigMapKind>;
  storages: VMWizardStorageWithWrappers[];
  addUpdateStorage: (storage: VMWizardStorage) => void;
  templateValidations: TemplateValidations;
};

const stateToProps = (state, { wizardReduxID }) => {
  const useProjects = state.k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
    namespace: iGetCommonData(state, wizardReduxID, VMWizardProps.activeNamespace),
    isCreateTemplate: iGetCommonData(state, wizardReduxID, VMWizardProps.isCreateTemplate),
    storageClassConfigMap: toShallowJS(
      iGetCommonData(state, wizardReduxID, VMWizardProps.storageClassConfigMap),
    ),
    storages: getStoragesWithWrappers(state, wizardReduxID),
    templateValidations: getTemplateValidation(state, wizardReduxID),
  };
};

const dispatchToProps = (dispatch, { wizardReduxID }) => ({
  addUpdateStorage: (storage: VMWizardStorage) => {
    dispatch(vmWizardActions[ActionType.UpdateStorage](wizardReduxID, storage));
  },
});

const VMWizardStorageModalConnected = connect(stateToProps, dispatchToProps)(VMWizardStorageModal);

export const vmWizardStorageModalEnhanced = createModalLauncher(VMWizardStorageModalConnected);
