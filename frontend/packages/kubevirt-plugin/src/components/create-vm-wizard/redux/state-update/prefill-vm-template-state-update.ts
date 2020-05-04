import { createBasicLookup, getName } from '@console/shared/src';
import { InternalActionType, UpdateOptions } from '../types';
import { iGetProvisionSource, iGetVmSettingValue } from '../../selectors/immutable/vm-settings';
import {
  CloudInitField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../types';
import {
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
} from '../../selectors/immutable/selectors';
import { concatImmutableLists, immutableListToShallowJS } from '../../../../utils/immutable';
import { iGetNetworks } from '../../selectors/immutable/networks';
import { podNetwork } from '../initial-state/networks-tab-initial-state';
import { vmWizardInternalActions } from '../internal-actions';
import {
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  NetworkInterfaceModel,
  VolumeType,
} from '../../../../constants/vm';
import {
  DEFAULT_CPU,
  getCPU,
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getMemory,
  getNetworks,
  getVolumes,
  hasAutoAttachPodInterface,
  isWinToolsImage,
  parseCPU,
} from '../../../../selectors/vm';
import {
  getTemplateFlavors,
  getTemplateHostname,
  getTemplateOperatingSystems,
  getTemplateWorkloadProfiles,
} from '../../../../selectors/vm-template/advanced';
import { V1Network } from '../../../../types/vm';
import { getFlavors } from '../../../../selectors/vm-template/combined-dependent';
import { getSimpleName } from '../../../../selectors/utils';
import { getNextIDResolver } from '../../../../utils/utils';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { V1Volume } from '../../../../types/vm/disk/V1Volume';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { getProvisionSourceStorage } from '../initial-state/storage-tab-initial-state';
import { CloudInitDataHelper } from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { getStorages } from '../../selectors/selectors';
import { DataVolumeWrapper } from '../../../../k8s/wrapper/vm/data-volume-wrapper';
import { V1alpha1DataVolume } from '../../../../types/vm/disk/V1alpha1DataVolume';
import { joinIDs } from '../../../../utils';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { convertToHighestUnitFromUnknown } from '../../../form/size-unit-utils';
import { toUIFlavor, isCustomFlavor } from '../../../../selectors/vm-like/flavor';

export const prefillVmTemplateUpdater = ({ id, dispatch, getState }: UpdateOptions) => {
  const state = getState();

  const userTemplateName = iGetVmSettingValue(state, id, VMSettingsField.USER_TEMPLATE);

  const iUserTemplates = iGetLoadedCommonData(state, id, VMWizardProps.userTemplates);
  const isProviderImport = iGetCommonData(state, id, VMWizardProps.isProviderImport);
  const activeNamespace = iGetCommonData(state, id, VMWizardProps.activeNamespace);

  const iUserTemplate =
    userTemplateName && iUserTemplates
      ? iUserTemplates.find((template) => iGetName(template) === userTemplateName)
      : null;

  let isCloudInitForm = null;
  const vmSettingsUpdate = {
    // ensure the the form is reset when "None" template is selected
    [VMSettingsField.FLAVOR]: { value: null },
    [VMSettingsField.OPERATING_SYSTEM]: { value: null },
    [VMSettingsField.WORKLOAD_PROFILE]: { value: null },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: { value: isProviderImport ? undefined : null },
    [VMSettingsField.HOSTNAME]: { value: null },
    [VMSettingsField.CPU]: { value: null },
    [VMSettingsField.MEMORY]: { value: null },
  };

  // filter out oldTemplates
  let networksUpdate = immutableListToShallowJS<VMWizardNetwork>(iGetNetworks(state, id)).filter(
    (network) => network.type !== VMWizardNetworkType.TEMPLATE,
  );
  const getNextNetworkID = getNextIDResolver(networksUpdate);

  const storagesUpdate = getStorages(state, id).filter(
    (storage) =>
      ![
        VMWizardStorageType.PROVISION_SOURCE_DISK,
        VMWizardStorageType.TEMPLATE,
        VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK,
        VMWizardStorageType.WINDOWS_GUEST_TOOLS_TEMPLATE,
      ].includes(storage.type) &&
      new VolumeWrapper(storage.volume).getType() !== VolumeType.CLOUD_INIT_NO_CLOUD,
  );
  const getNextStorageID = getNextIDResolver(storagesUpdate);

  if (!networksUpdate.find((row) => !!row.network.pod)) {
    networksUpdate.unshift({ ...podNetwork, id: getNextNetworkID() });
  }

  if (iUserTemplate) {
    const userTemplate = iUserTemplate.toJS();

    const vm = selectVM(userTemplate);
    const dataVolumes = immutableListToShallowJS<V1alpha1DataVolume>(
      iGetLoadedCommonData(state, id, VMWizardProps.dataVolumes),
    );

    // update flavor
    const [flavor] = getTemplateFlavors([userTemplate]);
    vmSettingsUpdate[VMSettingsField.FLAVOR] = {
      value: toUIFlavor(flavor),
    };
    if (isCustomFlavor(flavor)) {
      vmSettingsUpdate[VMSettingsField.CPU] = { value: parseCPU(getCPU(vm), DEFAULT_CPU).cores }; // TODO also add sockets + threads
      const memory = convertToHighestUnitFromUnknown(getMemory(vm));
      vmSettingsUpdate[VMSettingsField.MEMORY] = {
        value: memory ? memory.str : null,
      };
    }

    // update os
    const [os] = getTemplateOperatingSystems([userTemplate]);
    vmSettingsUpdate[VMSettingsField.OPERATING_SYSTEM] = { value: os && os.id };

    // update workload profile
    const [workload] = getTemplateWorkloadProfiles([userTemplate]);
    vmSettingsUpdate[VMSettingsField.WORKLOAD_PROFILE] = { value: workload };

    // update provision source
    const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(userTemplate, {
      convertTemplateDataVolumesToAttachClonedDisk: true,
    });
    vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE] = {
      value: provisionSourceDetails.type ? provisionSourceDetails.type.getValue() : null,
    };

    // update hostname
    const hostname = getTemplateHostname(userTemplate);
    vmSettingsUpdate[VMSettingsField.HOSTNAME] = { value: hostname };

    const networkLookup = createBasicLookup<V1Network>(getNetworks(vm), getSimpleName);
    // prefill networks
    const templateNetworks: VMWizardNetwork[] = getInterfaces(vm).map((intface) => ({
      id: getNextNetworkID(),
      type: VMWizardNetworkType.TEMPLATE,
      network: networkLookup[getSimpleName(intface)],
      networkInterface: {
        ...intface,
        model: intface.model || NetworkInterfaceModel.VIRTIO.getValue(),
      },
    }));

    // remove pod networks if there is already one in template or autoAttachPodInterface is set to false
    if (
      templateNetworks.some((network) => !!network.network.pod) ||
      !hasAutoAttachPodInterface(vm, true)
    ) {
      networksUpdate = networksUpdate.filter((network) => !network.network.pod);
    }

    networksUpdate.push(...templateNetworks);

    const volumeLookup = createBasicLookup<V1Volume>(getVolumes(vm), getSimpleName);
    const dataVolumeTemplatesLookup = createBasicLookup<V1alpha1DataVolume>(
      getDataVolumeTemplates(vm),
      getName,
    );

    const standaloneDataVolumeLookup = createBasicLookup<V1alpha1DataVolume>(dataVolumes, getName);

    // // prefill storage
    const templateStorages: VMWizardStorage[] = getDisks(vm).map((disk) => {
      const diskWrapper = new DiskWrapper(disk, true);
      const volumeWrapper = new VolumeWrapper(volumeLookup[diskWrapper.getName()], true);
      let dataVolume = dataVolumeTemplatesLookup[volumeWrapper.getDataVolumeName()];

      if (volumeWrapper.getType() === VolumeType.CLOUD_INIT_NO_CLOUD) {
        const helper = new CloudInitDataHelper(volumeWrapper.getCloudInitNoCloud());
        if (helper.includesOnlyFormValues()) {
          isCloudInitForm = true;
          helper.makeFormCompliant();
          volumeWrapper.setTypeData(helper.asCloudInitNoCloudSource());
          // do not overwrite with more cloud-init disks
        } else if (isCloudInitForm == null) {
          isCloudInitForm = false;
        }
      } else if (volumeWrapper.getType() === VolumeType.DATA_VOLUME && !dataVolume) {
        const newDataVolumeName = joinIDs(VM_TEMPLATE_NAME_PARAMETER, diskWrapper.getName());

        dataVolume = new DataVolumeWrapper(
          standaloneDataVolumeLookup[volumeWrapper.getDataVolumeName()],
          true,
        )
          .clearMetadata()
          .clearRuntimeMetadata() // removes status
          .setName(newDataVolumeName)
          // clone pvc
          .setType(DataVolumeSourceType.PVC, {
            name: volumeWrapper.getDataVolumeName(),
            namespace: activeNamespace,
          })
          .asResource();

        volumeWrapper.appendTypeData({ name: newDataVolumeName });
      }

      // TODO: can't be guest tools and provision source at the same time, refactor to flags?
      let type = diskWrapper.isFirstBootableDevice()
        ? VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK
        : VMWizardStorageType.TEMPLATE;

      if (isWinToolsImage(volumeWrapper.getContainerImage())) {
        type = VMWizardStorageType.WINDOWS_GUEST_TOOLS_TEMPLATE;
      }

      if (diskWrapper.getType() === DiskType.DISK && !diskWrapper.getDiskBus()) {
        diskWrapper.appendTypeData({ bus: DiskBus.VIRTIO.getValue() });
      }

      return {
        id: getNextStorageID(),
        type,
        volume: volumeWrapper.asResource(),
        dataVolume,
        disk: diskWrapper.asResource(),
        editConfig:
          type === VMWizardStorageType.PROVISION_SOURCE_TEMPLATE_DISK
            ? {
                isFieldEditableOverride: {
                  source: false,
                },
              }
            : undefined,
      };
    });
    storagesUpdate.unshift(...templateStorages);
  } else {
    const iCommonTemplates = iGetLoadedCommonData(state, id, VMWizardProps.commonTemplates);

    const flavors = getFlavors(
      immutableListToShallowJS(concatImmutableLists(iCommonTemplates, iUserTemplates)),
      {
        workload: iGetVmSettingValue(state, id, VMSettingsField.WORKLOAD_PROFILE),
        os: iGetVmSettingValue(state, id, VMSettingsField.OPERATING_SYSTEM),
        userTemplate: null,
      },
    );
    if (flavors.length === 1) {
      vmSettingsUpdate[VMSettingsField.FLAVOR] = {
        value: toUIFlavor(flavors[0]),
      };
    }

    const newSourceStorage = getProvisionSourceStorage(
      iGetProvisionSource(state, id),
      iGetLoadedCommonData(state, id, VMWizardProps.storageClassConfigMap),
    );
    if (newSourceStorage) {
      storagesUpdate.unshift({ ...newSourceStorage, id: getNextStorageID() });
    }
  }

  dispatch(vmWizardInternalActions[InternalActionType.UpdateVmSettings](id, vmSettingsUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetNetworks](id, networksUpdate));
  dispatch(vmWizardInternalActions[InternalActionType.SetStorages](id, storagesUpdate));
  if (isCloudInitForm != null) {
    dispatch(
      vmWizardInternalActions[InternalActionType.SetCloudInitFieldValue](
        id,
        CloudInitField.IS_FORM,
        isCloudInitForm,
      ),
    );
  }
};
