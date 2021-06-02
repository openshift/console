import { ValidationErrorType } from '@console/shared/src';
import { CLOUDINIT_DISK } from '../../../../constants';
import { winToolsContainerNames } from '../../../../constants/vm/wintools';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import {
  getDefaultSCAccessModes,
  getDefaultSCVolumeMode,
} from '../../../../selectors/config-map/sc-defaults';
import { getDataVolumeStorageClassName } from '../../../../selectors/dv/selectors';
import { getVolumeContainerImage } from '../../../../selectors/vm';
import { isWinToolsImage } from '../../../../selectors/vm/winimage';
import { toShallowJS } from '../../../../utils/immutable';
import { getEmptyInstallStorage } from '../../../../utils/storage';
import { getNextIDResolver } from '../../../../utils/utils';
import { TemplateValidations } from '../../../../utils/validations/template/template-validations';
import { StorageUISource } from '../../../modals/disk-modal/storage-ui-source';
import { iGetCommonData, iGetLoadedCommonData } from '../../selectors/immutable/selectors';
import {
  hasStoragesChanged,
  iGetProvisionSourceAdditionalStorage,
  iGetProvisionSourceStorage,
  iGetStorages,
} from '../../selectors/immutable/storage';
import {
  hasVMSettingsValueChanged,
  iGetVmSettingValue,
} from '../../selectors/immutable/vm-settings';
import { getStorages, getV2VConfigMap } from '../../selectors/selectors';
import { getTemplateValidation } from '../../selectors/template';
import { VMSettingsField, VMWizardProps, VMWizardStorage, VMWizardStorageType } from '../../types';
import {
  getNewProvisionSourceStorage,
  windowsToolsStorage,
} from '../initial-state/storage-tab-initial-state';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

export const prefillInitialDiskUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (
    !hasVMSettingsValueChanged(
      prevState,
      state,
      id,
      VMSettingsField.OPERATING_SYSTEM,
      VMSettingsField.FLAVOR,
      VMSettingsField.WORKLOAD_PROFILE,
      VMSettingsField.CLONE_COMMON_BASE_DISK_IMAGE,
      VMSettingsField.PROVISION_SOURCE_TYPE,
    )
  ) {
    return;
  }

  const iOldSourceStorage = iGetProvisionSourceStorage(state, id);
  const oldSourceStorage: VMWizardStorage = iOldSourceStorage && iOldSourceStorage.toJSON();

  // Depends on OPERATING_SYSTEM CLONE_COMMON_BASE_DISK_IMAGE PROVISION_SOURCE_TYPE FLAVOR USER_TEMPLATE and WORKLOAD_PROFILE
  const newSourceStorage = getNewProvisionSourceStorage(state, id);
  const oldType =
    (oldSourceStorage &&
      StorageUISource.fromTypes(
        new VolumeWrapper(oldSourceStorage.volume).getType(),
        new DataVolumeWrapper(oldSourceStorage.dataVolume).getType(),
      )) ||
    null;

  const newType =
    (newSourceStorage &&
      StorageUISource.fromTypes(
        new VolumeWrapper(newSourceStorage.volume).getType(),
        new DataVolumeWrapper(newSourceStorage.dataVolume).getType(),
      )) ||
    null;

  const baseDiskImageChanged =
    newSourceStorage?.dataVolume?.spec?.source?.pvc?.name !==
      oldSourceStorage?.dataVolume?.spec?.source?.pvc?.name &&
    newSourceStorage?.dataVolume?.spec?.source?.pvc?.namespace !==
      oldSourceStorage?.dataVolume?.spec?.source?.pvc?.namespace;

  if (newType !== oldType || baseDiskImageChanged) {
    const additionalStorage = iGetProvisionSourceAdditionalStorage(state, id)?.toJSON();
    if (!newSourceStorage) {
      if (additionalStorage) {
        dispatch(
          vmWizardInternalActions[InternalActionType.RemoveStorage](id, additionalStorage.id),
        );
      }
      // not a template provision source
      if (oldSourceStorage && oldSourceStorage.type === VMWizardStorageType.PROVISION_SOURCE_DISK) {
        dispatch(
          vmWizardInternalActions[InternalActionType.RemoveStorage](id, oldSourceStorage.id),
        );
      }
    } else {
      const iStorageClassConfigMap = iGetLoadedCommonData(
        state,
        id,
        VMWizardProps.storageClassConfigMap,
      );
      const idResolver = getNextIDResolver(getStorages(state, id));
      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
          id: oldSourceStorage ? oldSourceStorage.id : idResolver(),
          ...newSourceStorage,
        }),
      );
      if (newSourceStorage.disk.cdrom && !additionalStorage) {
        const emptyDisk = {
          id: idResolver(),
          type: VMWizardStorageType.PROVISION_SOURCE_ADDITIONAL_DISK,
          ...getEmptyInstallStorage(toShallowJS(iStorageClassConfigMap)),
        };

        dispatch(vmWizardInternalActions[InternalActionType.UpdateStorage](id, emptyDisk));
      } else if (additionalStorage) {
        dispatch(
          vmWizardInternalActions[InternalActionType.RemoveStorage](id, additionalStorage.id),
        );
      }
    }
  }
};

const windowsToolsUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  if (iGetCommonData(state, id, VMWizardProps.isProviderImport)) {
    return;
  }
  if (!hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS)) {
    return;
  }
  const mountWindowsGuestTools = iGetVmSettingValue(
    state,
    id,
    VMSettingsField.MOUNT_WINDOWS_GUEST_TOOLS,
  );
  const windowsTools = getStorages(state, id).find(
    (storage) => !!isWinToolsImage(getVolumeContainerImage(storage.volume)),
  );

  if (mountWindowsGuestTools && !windowsTools) {
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateStorage](
        id,
        windowsToolsStorage(winToolsContainerNames(getV2VConfigMap(state))),
      ),
    );
  }
  if (!mountWindowsGuestTools && windowsTools) {
    dispatch(vmWizardInternalActions[InternalActionType.RemoveStorage](id, windowsTools.id));
  }
};

export const internalStorageDiskBusUpdater = ({
  id,
  prevState,
  dispatch,
  getState,
}: UpdateOptions) => {
  const state = getState();

  // we care only about the first TemplateValidation because storage shows up after the first step
  const oldValidations = getTemplateValidation(prevState, id);
  let newValidations = getTemplateValidation(state, id);

  if (
    TemplateValidations.areBusesEqual(oldValidations, newValidations) &&
    !hasStoragesChanged(prevState, state, id)
  ) {
    return;
  }

  if (!newValidations) {
    newValidations = new TemplateValidations();
  }

  let someBusChanged = false;

  const updatedStorages = getStorages(state, id).map(({ type, disk, ...storageBundle }) => {
    let finalDisk = disk;
    if (
      [
        VMWizardStorageType.PROVISION_SOURCE_DISK,
        VMWizardStorageType.V2V_VMWARE_IMPORT,
        VMWizardStorageType.V2V_OVIRT_IMPORT,
        VMWizardStorageType.WINDOWS_GUEST_TOOLS,
      ].includes(type)
    ) {
      const diskWrapper = new DiskWrapper(disk);
      const diskType = diskWrapper.getType();
      const diskBus = diskWrapper.getDiskBus();
      const resultValidation = newValidations.validateBus(diskType, diskBus);
      if (!resultValidation.isValid && resultValidation.type === ValidationErrorType.Error) {
        someBusChanged = true;
        finalDisk = new DiskWrapper(disk, true)
          .appendTypeData({
            bus: newValidations.getDefaultBus(diskType).getValue(),
          })
          .asResource();
      }
    }

    return {
      ...storageBundle,
      type,
      disk: finalDisk,
    };
  });

  if (someBusChanged) {
    dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, updatedStorages));
  }
};

const initialStorageDiskUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();

  if (!hasStoragesChanged(prevState, state, id)) {
    return;
  }

  const provisionSourceStorage = iGetProvisionSourceStorage(state, id)?.toJSON();

  if (provisionSourceStorage) {
    const removableRootDisk = iGetStorages(state, id)
      ?.toJSON()
      ?.find(
        (disk) =>
          disk?.type === VMWizardStorageType.TEMPLATE && disk?.volume?.name !== CLOUDINIT_DISK,
      );

    removableRootDisk &&
      dispatch(
        vmWizardInternalActions[InternalActionType.RemoveStorage](id, removableRootDisk?.id),
      );
  }
};

const initialStorageClassUpdater = ({ id, prevState, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  const provisionSourceStorage = iGetProvisionSourceStorage(state, id)?.toJSON();
  const storageClassConfigMap = iGetCommonData(
    state,
    id,
    VMWizardProps.storageClassConfigMap,
  )?.toJSON();

  const { commonTemplateName } = iGetCommonData(state, id, VMWizardProps.initialData).toJSON();

  if (
    !hasStoragesChanged(prevState, state, id) ||
    !storageClassConfigMap ||
    !commonTemplateName ||
    !provisionSourceStorage
  ) {
    return;
  }

  const provisionSourceStorageClassName = getDataVolumeStorageClassName(
    provisionSourceStorage?.dataVolume,
  );

  const storageClassVolumeMode = getDefaultSCVolumeMode(
    storageClassConfigMap?.data,
    provisionSourceStorageClassName,
  );

  const storageClassAccessMode = getDefaultSCAccessModes(
    storageClassConfigMap?.data,
    provisionSourceStorageClassName,
  );

  if (
    storageClassVolumeMode &&
    storageClassAccessMode &&
    !provisionSourceStorage?.dataVolume?.spec?.source?.pvc
  ) {
    const updatedStorage = new DataVolumeWrapper(provisionSourceStorage.dataVolume)
      .setVolumeMode(storageClassVolumeMode)
      .setAccessModes(storageClassAccessMode)
      .asResource();
    dispatch(
      vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
        ...provisionSourceStorage,
        dataVolume: updatedStorage,
      }),
    );
  }
};

const initialDefaultStorageClassUpdater = ({
  id,
  prevState,
  dispatch,
  getState,
}: UpdateOptions) => {
  const state = getState();

  if (
    !hasVMSettingsValueChanged(prevState, state, id, VMSettingsField.DEFAULT_STORAGE_CLASS) &&
    !hasStoragesChanged(prevState, state, id)
  ) {
    return;
  }
  const storageClassName = iGetVmSettingValue(state, id, VMSettingsField.DEFAULT_STORAGE_CLASS);

  if (storageClassName) {
    const iProvisionSourceStorage = iGetProvisionSourceStorage(state, id);
    const provisionSourceStorage: VMWizardStorage =
      iProvisionSourceStorage && iProvisionSourceStorage.toJSON();

    if (
      provisionSourceStorage?.dataVolume &&
      !getDataVolumeStorageClassName(provisionSourceStorage.dataVolume)
    ) {
      const updatedStorage = new DataVolumeWrapper(provisionSourceStorage.dataVolume)
        .setStorageClassName(storageClassName)
        .asResource();

      dispatch(
        vmWizardInternalActions[InternalActionType.UpdateStorage](id, {
          ...provisionSourceStorage,
          dataVolume: updatedStorage,
        }),
      );
    }
  }
};

export const updateStorageTabState = (options: UpdateOptions) =>
  [
    prefillInitialDiskUpdater,
    windowsToolsUpdater,
    internalStorageDiskBusUpdater,
    initialDefaultStorageClassUpdater,
    initialStorageClassUpdater,
    initialStorageDiskUpdater,
  ].forEach((updater) => {
    updater && updater(options);
  });
