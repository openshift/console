import { DefaultTemplateParams } from './types';
import { TemplateKind } from '@console/internal/module/k8s';
import {
  MutableVMTemplateWrapper,
  VMTemplateWrapper,
} from '../../../wrapper/vm/vm-template-wrapper';
import { VM_TEMPLATE_NAME_PARAMETER } from '../../../../constants/vm-templates';
import {
  DiskBus,
  DiskType,
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

export const getDefaultVMTemplate = (params: DefaultTemplateParams): TemplateKind => {
  const { commonTemplate, name, namespace, containerImage, baseOSName } = params;
  const template = new MutableVMTemplateWrapper(commonTemplate, { copy: true });

  const vm = template.getMutableVM();
  const containerDiskName = 'containerdisk';

  vm.setHostname(VM_TEMPLATE_NAME_PARAMETER)
    .removeStorage('rootdisk')
    .prependStorage({
      disk: DiskWrapper.initializeFromSimpleData({
        name: containerDiskName,
        type: DiskType.DISK,
        bus: DiskBus.VIRTIO,
        bootOrder: 1,
      }).asResource(),
      volume: VolumeWrapper.initializeFromSimpleData({
        name: containerDiskName,
        type: VolumeType.CONTAINER_DISK,
        typeData: { image: containerImage },
      }).asResource(),
    });

  const finalTemplate = VMTemplateWrapper.initializeFromSimpleData({
    name,
    namespace,
    objects: [vm.asMutableResource()],
    parameters: [
      {
        name: TEMPLATE_PARAM_VM_NAME,
        description: TEMPLATE_PARAM_VM_NAME_DESC,
        required: true,
      },
    ],
  });

  const mutableFinalTemplate = new MutableVMTemplateWrapper(finalTemplate.asResource());

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
      [VMSettingsField.NAME]: name,
      [VMSettingsField.DESCRIPTION]: 'VM template example',
      [VMSettingsField.FLAVOR]: getFlavor(commonTemplate),
      [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(commonTemplate),
    },
    { osID, osName },
    mutableFinalTemplate,
    commonTemplate,
  );
  initializeCommonTemplateMetadata(mutableFinalTemplate, commonTemplate);

  return mutableFinalTemplate.asMutableResource();
};
