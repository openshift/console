import { ConfigMapKind, k8sCreate, TemplateKind } from '@console/internal/module/k8s';
import {
  AccessMode,
  ANNOTATION_FIRST_BOOT,
  LABEL_CDROM_SOURCE,
  DataVolumeSourceType,
  DiskType,
  ROOT_DISK_NAME,
  TEMPLATE_PARAM_VM_NAME,
  VolumeType,
} from '../../../../constants';
import { initializeCommonMetadata, initializeCommonVMMetadata } from './common';
import { DiskWrapper } from '../../../wrapper/vm/disk-wrapper';
import { VMTemplateWrapper } from '../../../wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../../wrapper/vm/vm-wrapper';
import { VolumeWrapper } from '../../../wrapper/vm/volume-wrapper';
import { VirtualMachineModel } from '../../../../models';
import { ProcessedTemplatesModel } from '../../../../models/models';
import { getFlavor, getWorkloadProfile } from '../../../../selectors/vm';
import {
  getTemplateOperatingSystems,
  isWindowsTemplate,
} from '../../../../selectors/vm-template/advanced';
import { selectVM } from '../../../../selectors/vm-template/basic';
import { isTemplateSourceError, TemplateSourceStatus } from '../../../../statuses/template/types';
import { VMSettingsField } from '../../../../components/create-vm-wizard/types';
import { FormState } from '../../../../components/create-vm/forms/create-vm-form-reducer';
import { BootSourceState } from '../../../../components/create-vm/forms/boot-source-form-reducer';
import { DataVolumeWrapper } from '../../../wrapper/vm/data-volume-wrapper';
import { windowsToolsStorage } from '../../../../components/create-vm-wizard/redux/initial-state/storage-tab-initial-state';
import { getEmptyInstallStorage } from '../../../../utils/storage';
import { ignoreCaseSort } from '../../../../utils/sort';

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
}) => {
  const dataSourceType = DataVolumeSourceType.fromString(dataSource);
  const size = dataSourceType === DataVolumeSourceType.PVC ? pvcSize : `${sizeValue}${sizeUnit}`;
  const dataVolume = new DataVolumeWrapper()
    .init({
      name,
      storageClassName: storageClass,
      size,
      unit: '',
    })
    .setAccessModes([AccessMode.fromString(accessMode) || AccessMode.READ_WRITE_ONCE]);
  dataVolume.setType(dataSourceType, {
    url: dataSourceType === DataVolumeSourceType.REGISTRY ? `docker://${container}` : url,
    name: pvcName,
    namespace: pvcNamespace,
  });
  if (cdRom) {
    dataVolume.addLabel(LABEL_CDROM_SOURCE, 'true');
  }
  return dataVolume;
};

export const createVM = async (
  template: TemplateKind,
  sourceStatus: TemplateSourceStatus,
  customSource: BootSourceState,
  { namespace, name, startVM }: FormState,
  scConfigMap: ConfigMapKind,
) => {
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
    customSource?.dataSource?.value ||
    (!isTemplateSourceError(sourceStatus) && sourceStatus.pvc)
  ) {
    const rootVolume = new VolumeWrapper();
    rootVolume.init({ name: ROOT_DISK_NAME }).setType(VolumeType.DATA_VOLUME, {
      name: `${name}-${ROOT_DISK_NAME}`,
    });

    const rootDisk = new DiskWrapper(
      vmWrapper.getDisks().find((d) => d.name === ROOT_DISK_NAME),
      true,
    ).setBootOrder(1);

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
        storageClass: customSource.storageClass.value,
        url: customSource.url?.value,
      });
    } else if (!isTemplateSourceError(sourceStatus)) {
      const { accessModes, resources, storageClassName } = sourceStatus.pvc.spec;
      isCDRom = sourceStatus.isCDRom;
      rootDataVolume = getRootDataVolume({
        name: rootVolume.getDataVolumeName(),
        accessMode: accessModes[0],
        cdRom: isCDRom,
        pvcName: sourceStatus.pvc.metadata.name,
        pvcNamespace: sourceStatus.pvc.metadata.namespace,
        dataSource: DataVolumeSourceType.PVC.getValue(),
        pvcSize: resources.requests.storage,
        storageClass: storageClassName,
      });
    }

    if (isCDRom) {
      rootDisk.setType(DiskType.CDROM, { bus: rootDisk.getDiskBus() });
      vmWrapper.prependStorage(getEmptyInstallStorage(scConfigMap, rootDisk.getDiskBus(), name));
      vmWrapper.addAnotation(ANNOTATION_FIRST_BOOT, `${!startVM}`);
    }
    vmWrapper.removeStorage(ROOT_DISK_NAME);

    vmWrapper.prependStorage({
      disk: rootDisk.asResource(),
      volume: rootVolume.asResource(),
      dataVolume: rootDataVolume.asResource(),
    });
  }

  if (isWindowsTemplate(template)) {
    vmWrapper.prependStorage({
      disk: windowsToolsStorage.disk,
      volume: windowsToolsStorage.volume,
    });
  }

  const os = ignoreCaseSort(getTemplateOperatingSystems([template]), ['name'])[0];

  const settings = {
    [VMSettingsField.NAME]: name,
    [VMSettingsField.DESCRIPTION]: null,
    [VMSettingsField.FLAVOR]: getFlavor(template),
    [VMSettingsField.WORKLOAD_PROFILE]: getWorkloadProfile(template),
    [VMSettingsField.TEMPLATE_PROVIDER]: null,
    osID: os?.id,
    osName: os?.name,
  };

  initializeCommonMetadata(settings, vmWrapper, template);
  initializeCommonVMMetadata(settings, vmWrapper);

  const res = vmWrapper.asResource();
  res.spec.running = startVM;

  return k8sCreate(VirtualMachineModel, res);
};
