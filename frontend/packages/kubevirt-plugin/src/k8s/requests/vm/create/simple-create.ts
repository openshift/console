import { isEmpty } from 'lodash';
import { ConfigMapKind, k8sCreate, TemplateKind } from '@console/internal/module/k8s';
import { windowsToolsStorage } from '../../../../components/create-vm-wizard/redux/initial-state/storage-tab-initial-state';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { BootSourceState } from '../../../../components/create-vm/forms/boot-source-form-reducer';
import { AUTHORIZED_SSH_KEYS } from '../../../../components/ssh-service/SSHForm/ssh-form-utils';
import {
  AccessMode,
  ANNOTATION_FIRST_BOOT,
  ANNOTATION_SOURCE_PROVIDER,
  DataVolumeSourceType,
  DiskBus,
  DiskType,
  LABEL_CDROM_SOURCE,
  TEMPLATE_PARAM_VM_NAME,
  VolumeMode,
  VolumeType,
} from '../../../../constants';
import { CLOUDINIT_DISK } from '../../../../constants/vm/constants';
import { ProvisionSource } from '../../../../constants/vm/provision-source';
import { winToolsContainerNames } from '../../../../constants/vm/wintools';
import { VirtualMachineModel } from '../../../../models';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { getFlavor, getWorkloadProfile } from '../../../../selectors/vm';
import {
  getTemplateOperatingSystems,
  isWindowsTemplate,
} from '../../../../selectors/vm-template/advanced';
import { isCommonTemplate, selectVM } from '../../../../selectors/vm-template/basic';
import { isTemplateSourceError, TemplateSourceStatus } from '../../../../statuses/template/types';
import { VMKind } from '../../../../types';
import { ignoreCaseSort } from '../../../../utils/sort';
import { getEmptyInstallStorage } from '../../../../utils/storage';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { DiskWrapper } from '../../../wrapper/vm/disk-wrapper';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { initializeCommonMetadata, initializeCommonVMMetadata } from './common';

type GetRootDataVolume = (args: {
  name: string;
  pvcSize: string;
  sizeValue?: number;
  sizeUnit?: string;
  storageClass: string;
  dataSource: string;
  url?: string;
  pvcName: string;
  pvcNamespace: string;
  container?: string;
  cdRom: boolean;
  accessMode: string;
  provider?: string;
  volumeMode: string;
}) => DataVolumeWrapper;

export const getRootDataVolume: GetRootDataVolume = ({
  name,
  pvcSize,
  sizeValue,
  sizeUnit,
  storageClass,
  dataSource,
  url,
  pvcName,
  pvcNamespace,
  container,
  cdRom,
  accessMode,
  provider,
  volumeMode,
}) => {
  const provisionSource = ProvisionSource.fromString(dataSource);
  const size = provisionSource === ProvisionSource.DISK ? pvcSize : `${sizeValue}${sizeUnit}`;
  const dataVolume = new DataVolumeWrapper()
    .init({
      name,
      storageClassName: storageClass,
      size,
      unit: '',
    })
    .setAccessModes([AccessMode.fromString(accessMode) || AccessMode.READ_WRITE_ONCE])
    .setVolumeMode(VolumeMode.fromString(volumeMode));
  dataVolume.setType(DataVolumeSourceType.fromString(provisionSource.getValue()), {
    url: provisionSource === ProvisionSource.CONTAINER ? container : url,
    name: pvcName,
    namespace: pvcNamespace,
  });
  if (cdRom) {
    dataVolume.addLabel(LABEL_CDROM_SOURCE, 'true');
  }
  if (provider) {
    dataVolume.addAnotation(ANNOTATION_SOURCE_PROVIDER, provider);
  }
  return dataVolume;
};

export const prepareVM = async (
  template: TemplateKind,
  sourceStatus: TemplateSourceStatus,
  customSource: BootSourceState,
  { namespace, name, startVM }: { namespace: string; name: string; startVM: boolean },
  scConfigMap: ConfigMapKind,
  sshKey?: string,
  enableSSHService?: boolean,
  containerImagesNames?: { [key: string]: string },
  emptyDiskSize?: string,
  referenceTemplate = true,
): Promise<VMKind> => {
  const templateWrapper = new VMTemplateWrapper(template, true);
  templateWrapper
    .setNamespace(namespace)
    .setParameter(TEMPLATE_PARAM_VM_NAME, name)
    .unrequireParameters(
      new Set(
        templateWrapper
          .getParameters()
          .map((p) => p.name)
          .filter((n) => n !== TEMPLATE_PARAM_VM_NAME),
      ),
    );
  const processedTemplate = await k8sCreate(ProcessedTemplatesModel, templateWrapper.asResource());
  const vmWrapper = new VMWrapper(selectVM(processedTemplate))
    .setNamespace(namespace)
    .setHostname(name);

  if (
    isCommonTemplate(template) &&
    (customSource?.dataSource?.value || (!isTemplateSourceError(sourceStatus) && sourceStatus.pvc))
  ) {
    const bootDisk = vmWrapper.getBootDisk();
    vmWrapper.removeStorage(bootDisk.name);

    const rootVolume = new VolumeWrapper()
      .init({ name: bootDisk.name })
      .setType(VolumeType.DATA_VOLUME, {
        name,
      });

    const rootDisk = new DiskWrapper(bootDisk).setBootOrder(1);
    let rootDataVolume;
    let isCDRom: boolean;

    if (customSource?.dataSource?.value) {
      isCDRom = customSource.cdRom?.value;
      rootDataVolume = getRootDataVolume({
        name: rootVolume.getDataVolumeName(),
        accessMode: customSource.accessMode.value,
        cdRom: isCDRom,
        container: customSource.container?.value,
        pvcName: customSource.pvcName?.value,
        pvcNamespace: customSource.pvcNamespace?.value,
        dataSource: customSource.dataSource.value,
        pvcSize: customSource.pvcSize?.value,
        sizeValue: customSource.size?.value.value,
        sizeUnit: customSource.size?.value.unit,
        storageClass: customSource.storageClass?.value,
        url: customSource.url?.value,
        volumeMode: customSource.volumeMode.value,
      });
    } else if (!isTemplateSourceError(sourceStatus)) {
      const { accessModes, resources, storageClassName, volumeMode } = sourceStatus.pvc.spec;
      isCDRom = sourceStatus.isCDRom;
      rootDataVolume = getRootDataVolume({
        name: rootVolume.getDataVolumeName(),
        accessMode: accessModes[0],
        cdRom: isCDRom,
        pvcName: sourceStatus.pvc.metadata.name,
        pvcNamespace: sourceStatus.pvc.metadata.namespace,
        dataSource: ProvisionSource.DISK.getValue(),
        pvcSize: resources.requests.storage,
        storageClass: storageClassName,
        volumeMode,
      });
    }

    if (isCDRom) {
      const rootDiskBus = rootDisk.getDiskBus();
      rootDisk.setType(DiskType.CDROM, {
        bus: rootDiskBus === DiskBus.VIRTIO ? DiskBus.SATA : rootDiskBus,
      });
      vmWrapper.prependStorage(
        getEmptyInstallStorage(scConfigMap, rootDiskBus, name, emptyDiskSize),
      );
      vmWrapper.addAnotation(ANNOTATION_FIRST_BOOT, `${!startVM}`);
    }

    vmWrapper.prependStorage({
      disk: rootDisk.asResource(),
      volume: rootVolume.asResource(),
      dataVolume: rootDataVolume.asResource(),
    });

    if (isWindowsTemplate(template)) {
      vmWrapper.prependStorage({
        disk: windowsToolsStorage(winToolsContainerNames(containerImagesNames)).disk,
        volume: windowsToolsStorage(winToolsContainerNames(containerImagesNames)).volume,
      });
    } else if (!isEmpty(sshKey) && enableSSHService) {
      vmWrapper.updateVolume(
        new VolumeWrapper()
          .init({ name: CLOUDINIT_DISK })
          .setType(VolumeType.CLOUD_INIT_CONFIG_DRIVE)
          .setTypeData(
            vmWrapper.getVolumes().find(({ name: volumeName }) => volumeName === CLOUDINIT_DISK)
              ?.cloudInitNoCloud,
          )
          .asResource(),
      );
      vmWrapper.setSSHKey([`${AUTHORIZED_SSH_KEYS}-${name}`]);
    }
  }

  const os = ignoreCaseSort(getTemplateOperatingSystems([template]), ['name'])[0];

  const settings = {
    [VMSettingsField.NAME]: name,
    [VMSettingsField.DESCRIPTION]: null,
    [VMSettingsField.FLAVOR]: getFlavor(template),
    [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(template),
    [VMSettingsField.TEMPLATE_PROVIDER]: null,
    [VMSettingsField.TEMPLATE_SUPPORTED]: null,
    osID: os?.id,
    osName: os?.name,
  };

  initializeCommonMetadata(settings, vmWrapper, referenceTemplate ? template : undefined);
  initializeCommonVMMetadata(settings, vmWrapper);

  const res = vmWrapper.asResource();
  res.spec.running = startVM;

  return res;
};

export const createVM = async (
  template: TemplateKind,
  sourceStatus: TemplateSourceStatus,
  customSource: BootSourceState,
  opts: { namespace: string; name: string; startVM: boolean },
  scConfigMap: ConfigMapKind,
  sshKey?: string,
  enableSSHService?: boolean,
  containerImages?: { [key: string]: string },
) => {
  const vm = await prepareVM(
    template,
    sourceStatus,
    customSource,
    opts,
    scConfigMap,
    sshKey,
    enableSSHService,
    containerImages,
  );
  return k8sCreate(VirtualMachineModel, vm);
};
