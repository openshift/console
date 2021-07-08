import * as _ from 'lodash';
import { TemplateModel } from '@console/internal/models';
import {
  k8sCreate,
  k8sPatchByName,
  PersistentVolumeClaimKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import { ANNOTATIONS } from '@console/shared/src';
import { VMSettingsField } from '../../../components/create-vm-wizard/types';
import {
  AccessMode,
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
  TEMPLATE_BASE_IMAGE_NAME_PARAMETER,
  TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER,
  TEMPLATE_CUSTOMIZED_ANNOTATION,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_PROVIDER_ANNOTATION,
  TEMPLATE_SUPPORT_LEVEL,
  TEMPLATE_TYPE_LABEL,
  TEMPLATE_TYPE_VM,
  VM_CUSTOMIZE_LABEL,
  VM_TEMPLATE_NAME_PARAMETER,
  VolumeMode,
} from '../../../constants';
import { TemplateSupport } from '../../../constants/vm-templates/support';
import { DataVolumeSourceType } from '../../../constants/vm/storage';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getKubevirtAvailableModel } from '../../../models/kubevirtReferenceForModel';
import { isCommonTemplate } from '../../../selectors/vm-template/basic';
import { TemplateSourceStatus } from '../../../statuses/template/types';
import { VMKind } from '../../../types';
import { getRandomChars, buildOwnerReference } from '../../../utils';
import { DataVolumeWrapper } from '../../wrapper/vm/data-volume-wrapper';
import { VMTemplateWrapper } from '../../wrapper/vm/vm-template-wrapper';
import { VMWrapper } from '../../wrapper/vm/vm-wrapper';
import { initializeCommonMetadata, initializeCommonTemplateMetadata } from '../vm/create/common';
import { prepareVM } from '../vm/create/simple-create';

export const createTemplateFromVM = (vm: VMKind): Promise<TemplateKind> => {
  const template = JSON.parse(
    vm.metadata.annotations[TEMPLATE_CUSTOMIZED_ANNOTATION],
  ) as TemplateKind;

  const vmWrapper = new VMWrapper(vm, true);
  const templateWrapper = new VMTemplateWrapper(template);
  const templateVM = templateWrapper.getVM();

  // metadata
  templateVM.addLabel(LABEL_USED_TEMPLATE_NAME, template.metadata.name);
  templateVM.addLabel(LABEL_USED_TEMPLATE_NAMESPACE, template.metadata.namespace);

  // disks
  const bootDevice = vmWrapper.getBootDevice();
  const vmDisks = vmWrapper.getDisks();
  const vmVolumes = vmWrapper.getVolumes();
  const dataVolumes = vmWrapper.getDataVolumeTemplates();
  const storages = _.compact(
    vmDisks.map((disk) => {
      const volume = vmVolumes.find((v) => v.name === disk.name);
      // do not replace cloud-init
      if (volume.cloudInitNoCloud) {
        return undefined;
      }
      const dataVolume = volume.dataVolume
        ? dataVolumes.find((dv) => dv.metadata.name === volume.dataVolume.name)
        : undefined;

      disk.name = disk.name.replace(vmWrapper.getName(), VM_TEMPLATE_NAME_PARAMETER);
      volume.name = disk.name;
      if (dataVolume) {
        dataVolume.spec.source = {
          pvc: {
            name: dataVolume.metadata.name,
            namespace: vm.metadata.namespace,
          },
        };
        dataVolume.metadata.name = dataVolume.metadata.name.replace(
          (bootDevice.type === 'disk' && disk.name === bootDevice.device.name
            ? templateWrapper
            : vmWrapper
          ).getName(),
          VM_TEMPLATE_NAME_PARAMETER,
        );
        volume.dataVolume.name = dataVolume.metadata.name;
      }
      return {
        disk,
        volume,
        dataVolume,
      };
    }),
  );

  // use original template cloud-init
  const cloudInitVolume = templateVM.getVolumes().find((v) => v.cloudInitNoCloud);
  if (cloudInitVolume) {
    storages.push({
      disk: templateVM.getDisks().find((d) => d.name === cloudInitVolume.name),
      volume: cloudInitVolume,
      dataVolume: undefined,
    });
  }

  templateVM.setStorage(storages);

  // cdrom boot disk or pxe
  if (
    (bootDevice?.type === 'disk' && bootDevice.device.cdrom) ||
    bootDevice?.type === 'interface'
  ) {
    const disks = templateVM.getDisks();
    const secondaryBootDisk = disks.find((d) => d.bootOrder === 2) || disks[0];
    if (secondaryBootDisk) {
      bootDevice?.type === 'disk'
        ? templateVM.removeStorage(bootDevice.device.name)
        : templateVM.removeInterface(bootDevice.device.name);
      secondaryBootDisk.bootOrder = 1;
    }
  }

  return k8sCreate(TemplateModel, template);
};

export const patchVMDisks = (vm: VMKind, template: TemplateKind) => {
  const vmWrapper = new VMWrapper(vm);
  return vmWrapper.getDataVolumeTemplates().map((dv) =>
    k8sPatchByName(DataVolumeModel, dv.metadata.name, vm.metadata.namespace, [
      {
        op: 'replace',
        path: '/metadata/ownerReferences',
        value: [buildOwnerReference(template, { blockOwnerDeletion: false })],
      },
    ]),
  );
};

export const createVMForCustomization = async (
  template: TemplateKind,
  cloudInit: string,
  sourceStatus: TemplateSourceStatus,
  namespace: string,
  name: string,
  size: string,
  pvcs: PersistentVolumeClaimKind[],
  provider: string,
  support: string,
): Promise<VMKind> => {
  const templateWrapper = new VMTemplateWrapper(template, true);

  templateWrapper.setName(name);
  templateWrapper.setNamespace(namespace);

  // change cloud-init only for temporary VM
  const tmpTemplateWrapper = new VMTemplateWrapper(templateWrapper, true);
  const templateVMWrapper = tmpTemplateWrapper.getVM();
  const cloudInitVolume = templateVMWrapper.getCloudInitVolume();
  const cloudInitDisk =
    cloudInitVolume && templateVMWrapper.getDisks().find((d) => d.name === cloudInitVolume.name);
  if (cloudInitVolume) {
    templateVMWrapper.removeStorage(cloudInitVolume.name);
  }
  if (cloudInit) {
    templateVMWrapper.appendStorage({
      disk: cloudInitDisk,
      volume: {
        name: cloudInitDisk.name,
        cloudInitNoCloud: {
          userData: cloudInit,
        },
      },
    });
  }

  const vm = await prepareVM(
    tmpTemplateWrapper.asResource(),
    sourceStatus,
    undefined,
    {
      namespace,
      name: `${name}-tmp-${getRandomChars(5)}`,
      startVM: true,
    },
    undefined,
    undefined,
    undefined,
    undefined,
    size,
    false,
  );

  const templateSupport =
    TemplateSupport.fromString(support) === TemplateSupport.FULL_SUPPORT ? support : undefined;

  if (isCommonTemplate(template)) {
    templateWrapper.removeParameter(TEMPLATE_BASE_IMAGE_NAME_PARAMETER);
    templateWrapper.removeParameter(TEMPLATE_BASE_IMAGE_NAMESPACE_PARAMETER);

    const annotations = templateWrapper.getAnnotations();
    const osID = templateWrapper.getOperatingSystem();
    const flavor = templateWrapper.getFlavor();
    const workloadProfile = templateWrapper.getWorkloadProfile();

    const settings = {
      [VMSettingsField.DESCRIPTION]: undefined,
      [VMSettingsField.FLAVOR]: flavor,
      [VMSettingsField.WORKLOAD_PROFILE]: workloadProfile,
      [VMSettingsField.TEMPLATE_PROVIDER]: provider,
      [VMSettingsField.TEMPLATE_SUPPORTED]: templateSupport,
      osID,
      osName: annotations[`${TEMPLATE_OS_NAME_ANNOTATION}/${osID}`],
    };

    templateWrapper.removeLabels();
    templateWrapper.removeAnnotations();

    initializeCommonMetadata(settings, templateWrapper);
    initializeCommonTemplateMetadata(settings, templateWrapper, template);
  } else {
    templateWrapper.addAnotation(TEMPLATE_PROVIDER_ANNOTATION, provider);
    templateSupport
      ? templateWrapper.addAnotation(TEMPLATE_SUPPORT_LEVEL, templateSupport)
      : templateWrapper.removeAnnotation(TEMPLATE_SUPPORT_LEVEL);
  }

  templateWrapper.clearRuntimeMetadata();
  templateWrapper.removeAnnotation(ANNOTATIONS.displayName);
  templateWrapper.addLabel(TEMPLATE_TYPE_LABEL, TEMPLATE_TYPE_VM);

  vm.metadata.annotations = {
    ...(vm.metadata.annotations || {}),
    [TEMPLATE_CUSTOMIZED_ANNOTATION]: JSON.stringify(templateWrapper.asResource()),
  };
  vm.metadata.labels = {
    ...(vm.metadata.labels || {}),
    [VM_CUSTOMIZE_LABEL]: 'true',
  };

  const vmWrapper = new VMWrapper(vm);

  vmWrapper
    .getVolumes()
    .filter((v) => v.persistentVolumeClaim)
    .forEach((v) => {
      const volumePVC = pvcs.find(
        (pvc) =>
          pvc.metadata.namespace === template.metadata.namespace &&
          pvc.metadata.name === v.persistentVolumeClaim.claimName,
      );
      const dvName = `${name}-${getRandomChars(5)}`;
      const dataVolume = new DataVolumeWrapper()
        .init({
          name: dvName,
          storageClassName: volumePVC.spec.storageClassName,
        })
        .setType(DataVolumeSourceType.PVC, {
          name: volumePVC.metadata.name,
          namespace: volumePVC.metadata.namespace,
        })
        .setRawSize(volumePVC.spec.resources.requests.storage)
        .setAccessModes(volumePVC.spec.accessModes.map(AccessMode.fromString))
        .setVolumeMode(VolumeMode.fromString(volumePVC.spec.volumeMode))
        .asResource();

      delete v.persistentVolumeClaim;
      v.dataVolume = {
        name: dvName,
      };
      vmWrapper.updateVolume(v);
      vmWrapper.appendStorage({ dataVolume });
    });

  const dataVolumeTemplates = vmWrapper.getDataVolumeTemplates();

  // direct references to DV
  vmWrapper
    .getVolumes()
    .filter(
      (v) =>
        v.dataVolume && !dataVolumeTemplates.some((dvt) => dvt.metadata.name === v.dataVolume.name),
    )
    .forEach((v) => {
      const volumePVC = pvcs.find(
        (pvc) =>
          pvc.metadata.namespace === template.metadata.namespace &&
          pvc.metadata.name === v.dataVolume.name,
      );
      const dvName = `${name}-${getRandomChars(5)}`;
      const dataVolume = new DataVolumeWrapper()
        .init({
          name: dvName,
          storageClassName: volumePVC.spec.storageClassName,
        })
        .setType(DataVolumeSourceType.PVC, {
          name: volumePVC.metadata.name,
          namespace: volumePVC.metadata.namespace,
        })
        .setRawSize(volumePVC.spec.resources.requests.storage)
        .setAccessModes(volumePVC.spec.accessModes.map(AccessMode.fromString))
        .setVolumeMode(VolumeMode.fromString(volumePVC.spec.volumeMode))
        .asResource();

      v.dataVolume = {
        name: dvName,
      };
      vmWrapper.updateVolume(v);
      vmWrapper.appendStorage({ dataVolume });
    });

  const bootDevice = vmWrapper.getBootDevice();
  if (bootDevice.type === 'disk') {
    const bootVolume = vmWrapper.getVolumes().find((v) => v.name === bootDevice.device.name);
    const bootDV = dataVolumeTemplates.find(
      (dv) => dv.metadata.name === bootVolume.dataVolume.name,
    );
    if (bootDV) {
      bootVolume.dataVolume.name = name;
      bootDV.metadata.name = name;
    }
  }

  return k8sCreate(getKubevirtAvailableModel(VirtualMachineModel), vm);
};
