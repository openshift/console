import { Set } from 'immutable';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants';
import { DiskBus, DiskType, NetworkInterfaceModel, VolumeType } from '../../../../constants/vm';
import { ROOT_DISK_NAME } from '../../../../constants/vm/constants';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { CloudInitDataHelper } from '../../../../k8s/wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../../k8s/wrapper/vm/volume-wrapper';
import { getName } from '../../../../selectors';
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
  parseCPU,
} from '../../../../selectors/vm';
import { isCustomFlavor, toUIFlavor } from '../../../../selectors/vm-like/flavor';
import {
  getTemplateFlavors,
  getTemplateHostname,
  getTemplateOperatingSystems,
  getTemplateWorkloadProfiles,
} from '../../../../selectors/vm-template/advanced';
import { isCommonTemplate, selectVM } from '../../../../selectors/vm-template/basic';
import { isWinToolsImage } from '../../../../selectors/vm/winimage';
import { V1alpha1DataVolume, V1Volume } from '../../../../types/api';
import { V1Network } from '../../../../types/vm';
import { getSimpleName, createBasicLookup } from '../../../../utils';
import { immutableListToShallowJS, toShallowJS } from '../../../../utils/immutable';
import { getNextIDResolver } from '../../../../utils/utils';
import { convertToHighestUnitFromUnknown } from '../../../form/size-unit-utils';
import { iGetNetworks } from '../../selectors/immutable/networks';
import {
  getInitialData,
  iGetCommonData,
  iGetLoadedCommonData,
  iGetName,
} from '../../selectors/immutable/selectors';
import { getStorages } from '../../selectors/selectors';
import {
  CloudInitField,
  VMSettingsField,
  VMWizardNetwork,
  VMWizardNetworkType,
  VMWizardProps,
  VMWizardStorage,
  VMWizardStorageType,
} from '../../types';
import { podNetwork } from '../initial-state/networks-tab-initial-state';
import { getNewProvisionSourceStorage } from '../initial-state/storage-tab-initial-state';
import { vmWizardInternalActions } from '../internal-actions';
import { InternalActionType, UpdateOptions } from '../types';

export const prefillVmTemplateUpdater = ({ id, dispatch, getState }: UpdateOptions) => {
  const state = getState();
  const { commonTemplateName } = getInitialData(state, id);

  const isProviderImport = iGetCommonData(state, id, VMWizardProps.isProviderImport);

  const iTemplate = commonTemplateName
    ? iGetLoadedCommonData(
        state,
        id,
        commonTemplateName ? VMWizardProps.commonTemplates : VMWizardProps.userTemplates,
      ).find((template) => iGetName(template) === commonTemplateName)
    : iGetLoadedCommonData(state, id, VMWizardProps.userTemplate);

  let isCloudInitForm = null;
  const vmSettingsUpdate = {
    // ensure the the form is reset when "None" template is selected
    [VMSettingsField.FLAVOR]: { value: null },
    [VMSettingsField.OPERATING_SYSTEM]: { value: null },
    [VMSettingsField.WORKLOAD_PROFILE]: { value: null },
    [VMSettingsField.PROVISION_SOURCE_TYPE]: {
      value: isProviderImport || commonTemplateName ? undefined : null,
    } as { value: string; sources?: any },
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

  if (iTemplate) {
    const template = toShallowJS(iTemplate);

    const vm = selectVM(template);

    // update flavor
    const [flavor] = getTemplateFlavors([template]);
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
    const [os] = getTemplateOperatingSystems([template]);
    vmSettingsUpdate[VMSettingsField.OPERATING_SYSTEM] = { value: os && os.id };

    // update workload profile
    const [workload] = getTemplateWorkloadProfiles([template]);
    vmSettingsUpdate[VMSettingsField.WORKLOAD_PROFILE] = { value: workload };

    // update provision source
    const { source } = getInitialData(state, id);
    let sourceType: ProvisionSource;
    const hasCustomSource =
      source?.url || source?.container || (source?.pvcName && source?.pvcNamespace);
    if (hasCustomSource) {
      if (source?.url) {
        sourceType = ProvisionSource.URL;
      } else if (source?.container) {
        sourceType = ProvisionSource.CONTAINER;
      } else if (source?.pvcName && source?.pvcNamespace) {
        sourceType = ProvisionSource.DISK;
      }
    } else {
      const provisionSourceDetails = ProvisionSource.getProvisionSourceDetails(template);
      sourceType = provisionSourceDetails?.type;
    }

    vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE] = {
      value: sourceType?.getValue(),
    };

    if (!isCommonTemplate(template) && sourceType) {
      vmSettingsUpdate[VMSettingsField.PROVISION_SOURCE_TYPE].sources = Set([
        sourceType.getValue(),
      ]);
    }

    // update hostname
    const hostname = getTemplateHostname(template);
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

    const vmDisks = commonTemplateName
      ? getDisks(vm).filter((d) => d.name !== VM_TEMPLATE_NAME_PARAMETER)
      : getDisks(vm);

    // prefill storage
    const templateStorages: VMWizardStorage[] = vmDisks.map((disk) => {
      const diskWrapper = new DiskWrapper(disk, true);
      const volumeWrapper = new VolumeWrapper(volumeLookup[diskWrapper.getName()], true);
      const dataVolume = dataVolumeTemplatesLookup[volumeWrapper.getDataVolumeName()];

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
        volumeWrapper.setType(VolumeType.PERSISTENT_VOLUME_CLAIM, {
          claimName: volumeWrapper.getDataVolumeName(),
        });
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
    let rootDiskIndex = templateStorages.findIndex((s) => s.disk.bootOrder === 1);

    if (rootDiskIndex === -1) {
      rootDiskIndex = templateStorages.findIndex((s) => s.disk.name === ROOT_DISK_NAME);
    }

    if (rootDiskIndex !== -1 && !!hasCustomSource) {
      templateStorages.splice(rootDiskIndex, 1);
    }
    storagesUpdate.unshift(...templateStorages);
  } else {
    const newSourceStorage = getNewProvisionSourceStorage(state, id);
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
