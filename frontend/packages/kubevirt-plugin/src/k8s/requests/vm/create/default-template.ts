import { TemplateKind } from '@console/internal/module/k8s';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import {
  DiskBus,
  DiskType,
  NetworkInterfaceModel,
  TEMPLATE_OS_LABEL,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_PARAM_VM_NAME,
  TEMPLATE_PARAM_VM_NAME_DESC,
  VolumeType,
} from '../../../../constants/vm';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates/constants';
import { getAnnotations, getValueByPrefix } from '../../../../selectors/selectors';
import { getFlavor, getWorkloadProfile } from '../../../../selectors/vm';
import { findHighestKeyBySuffixValue } from '../../../../utils';
import {
  CloudInitDataFormKeys,
  CloudInitDataHelper,
  generateCloudInitPassword,
} from '../../../wrapper/vm/cloud-init-data-helper';
import { DiskWrapper } from '../../../wrapper/vm/disk-wrapper';
import { NetworkInterfaceWrapper } from '../../../wrapper/vm/network-interface-wrapper';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { initializeCommonMetadata, initializeCommonTemplateMetadata } from './common';
import { DefaultVMLikeEntityParams } from './types';

export const resolveDefaultVMTemplate = (params: DefaultVMLikeEntityParams): TemplateKind => {
  const { commonTemplate, name, namespace, containerImage, baseOSName } = params;
  const template = new VMTemplateWrapper(commonTemplate, true);

  const vm = template.getVM();
  const containerDiskName = 'containerdisk';

  vm.setHostname(VM_TEMPLATE_NAME_PARAMETER)
    .setNetworkInterfaces(
      vm.getNetworkInterfaces().map((networkInterface) => {
        const networkInterfaceWrapper = new NetworkInterfaceWrapper(networkInterface);
        if (!networkInterfaceWrapper.getModel()) {
          networkInterfaceWrapper.setModel(NetworkInterfaceModel.VIRTIO);
        }
        return networkInterfaceWrapper.asResource();
      }),
    )
    .removeStorage('rootdisk')
    .removeStorage(VM_TEMPLATE_NAME_PARAMETER)
    .prependStorage({
      disk: new DiskWrapper()
        .init({
          name: containerDiskName,
          bootOrder: 1,
        })
        .setType(DiskType.DISK, { bus: DiskBus.VIRTIO })
        .asResource(),
      volume: new VolumeWrapper()
        .init({
          name: containerDiskName,
        })
        .setType(VolumeType.CONTAINER_DISK, { image: containerImage })
        .asResource(),
    });

  const cloudInitVolume = vm.getCloudInitVolume();
  const cloudInitHelper = new CloudInitDataHelper(cloudInitVolume?.cloudInitNoCloud);
  if (!cloudInitHelper.isEmpty() && cloudInitHelper.hasKey(CloudInitDataFormKeys.PASSWORD)) {
    cloudInitHelper.set(CloudInitDataFormKeys.PASSWORD, generateCloudInitPassword());
    vm.updateVolume(
      new VolumeWrapper(cloudInitVolume)
        .setTypeData(cloudInitHelper.asCloudInitNoCloudSource())
        .asResource(),
    );
  }

  const finalTemplate = new VMTemplateWrapper().init({
    name,
    namespace,
    objects: [vm.asResource()],
    parameters: [
      {
        name: TEMPLATE_PARAM_VM_NAME,
        description: TEMPLATE_PARAM_VM_NAME_DESC,
        required: true,
      },
    ],
  });

  const osID = findHighestKeyBySuffixValue(
    template.getLabels(),
    `${TEMPLATE_OS_LABEL}/${baseOSName}`,
  );

  const osName = getValueByPrefix(
    getAnnotations(commonTemplate),
    `${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`,
  );

  const settings = {
    [VMSettingsField.DESCRIPTION]: 'VM template example',
    [VMSettingsField.FLAVOR]: getFlavor(commonTemplate),
    [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(commonTemplate),
    [VMSettingsField.TEMPLATE_PROVIDER]: null,
    [VMSettingsField.TEMPLATE_SUPPORTED]: null,
    osID,
    osName,
  };

  initializeCommonMetadata(settings, finalTemplate, commonTemplate);
  initializeCommonTemplateMetadata(settings, finalTemplate, commonTemplate);

  return finalTemplate.asResource();
};
