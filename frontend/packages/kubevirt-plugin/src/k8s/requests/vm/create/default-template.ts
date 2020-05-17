import { DefaultVMLikeEntityParams } from './types';
import { TemplateKind } from '@console/internal/module/k8s';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
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
import { findHighestKeyBySuffixValue, getValueByPrefix } from '../../../../selectors/utils';
import { getAnnotations } from '../../../../selectors/selectors';
import { initializeCommonMetadata, initializeCommonTemplateMetadata } from './common';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { getFlavor, getWorkloadProfile } from '../../../../selectors/vm';
import { DiskWrapper } from '../../../wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { NetworkInterfaceWrapper } from '../../../wrapper/vm/network-interface-wrapper';

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

  initializeCommonMetadata(
    {
      [VMSettingsField.DESCRIPTION]: 'VM template example',
      [VMSettingsField.FLAVOR]: getFlavor(commonTemplate),
      [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(commonTemplate),
      osID,
      osName,
    },
    finalTemplate,
    commonTemplate,
  );
  initializeCommonTemplateMetadata(finalTemplate, commonTemplate);

  return finalTemplate.asResource();
};
