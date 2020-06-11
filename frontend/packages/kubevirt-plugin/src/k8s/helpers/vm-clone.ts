import { K8sResourceKind } from '@console/internal/module/k8s';
import { createBasicLookup, getName, getNamespace } from '@console/shared';
import { VMKind } from '../../types/vm';
import { generateDataVolumeName, getBasicID } from '../../utils';
import {
  getPvcAccessModes,
  getPvcStorageClassName,
  getPvcStorageSize,
  getPvcVolumeMode,
} from '../../selectors/pvc/selectors';
import { DataVolumeTemplate } from '../objects/vm/datavolume-template';
import {
  getOperatingSystem,
  getOperatingSystemName,
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
} from '../../selectors/vm';
import {
  getDataVolumeAccessModes,
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
  getDataVolumeVolumeMode,
} from '../../selectors/dv/selectors';
import {
  ANNOTATION_DESCRIPTION,
  TEMPLATE_OS_NAME_ANNOTATION,
  TEMPLATE_VM_NAME_LABEL,
} from '../../constants/vm';
import { VMWrapper } from '../wrapper/vm/vm-wrapper';

export type CloneTo = {
  name: string;
  namespace: string;
  description: string;
  startVM?: boolean;
};

export class VMClone {
  private vm: VMWrapper;

  private oldVMNamespace: string;

  constructor(vm: VMKind, values: CloneTo) {
    this.vm = new VMWrapper(vm, true);
    this.oldVMNamespace = getNamespace(vm);
    this.cleanVM();
    this.setValues(values);
  }

  private cleanVM = () => {
    const data = this.vm.asResource();
    const { metadata, spec } = data;

    if (metadata) {
      delete metadata.selfLink;
      delete metadata.resourceVersion;
      delete metadata.uid;
      delete metadata.creationTimestamp;
      delete metadata.generation;
    }

    if (spec.template.spec.domain) {
      delete spec.template.spec.domain.firmware;
    }
    delete data.status;
    spec.dataVolumeTemplates = [];

    this.vm.getNetworkInterfaces().forEach((intface) => delete intface.macAddress);
  };

  private setValues({ name, namespace, description, startVM = false }: CloneTo) {
    const data = this.vm.asResource();
    const osId = getOperatingSystem(data);
    const osName = getOperatingSystemName(data);

    this.vm.setName(name);
    this.vm.setNamespace(namespace);
    this.vm.setRunning(startVM);

    if (description) {
      this.vm.addAnotation(ANNOTATION_DESCRIPTION, description);
    }
    if (osId && osName) {
      this.vm.addAnotation(`${TEMPLATE_OS_NAME_ANNOTATION}/${osId}`, osName);
    }

    this.vm.addTemplateLabel(TEMPLATE_VM_NAME_LABEL, name);
    return this;
  }

  withClonedPVCs = (persistentVolumeClaimsToClone: K8sResourceKind[]) => {
    const pvcLookup = createBasicLookup(persistentVolumeClaimsToClone, getBasicID);
    const name = this.vm.getName();

    this.vm
      .getVolumes()
      .filter(getVolumePersistentVolumeClaimName)
      .forEach((volume) => {
        const pvcName = getVolumePersistentVolumeClaimName(volume);
        delete volume.persistentVolumeClaim;

        const pvc = pvcLookup[`${this.oldVMNamespace}-${pvcName}`];

        if (pvc) {
          const clonedDVTemplate = new DataVolumeTemplate({
            name: generateDataVolumeName(name, volume.name),
            pvcSourceName: pvcName,
            pvcSourceNamespace: this.oldVMNamespace,
            accessModes: getPvcAccessModes(pvc),
            volumeMode: getPvcVolumeMode(pvc),
            size: getPvcStorageSize(pvc),
            storageClassName: getPvcStorageClassName(pvc),
          }).build();

          this.vm.ensureDataVolumeTemplates().push(clonedDVTemplate);

          volume.dataVolume = {
            name: getName(clonedDVTemplate),
          };
        }
      });
    return this;
  };

  withClonedDataVolumes = (dataVolumes: K8sResourceKind[]) => {
    const dvLookup = createBasicLookup(dataVolumes, getBasicID);
    const name = this.vm.getName();

    this.vm
      .getVolumes()
      .filter(getVolumeDataVolumeName)
      .forEach((volume) => {
        const dvName = getVolumeDataVolumeName(volume);
        const dataVolume = dvLookup[`${this.oldVMNamespace}-${dvName}`];

        if (dataVolume) {
          const clonedDVTemplate = new DataVolumeTemplate({
            name: generateDataVolumeName(name, volume.name),
            pvcSourceName: dvName,
            pvcSourceNamespace: this.oldVMNamespace,
            accessModes: getDataVolumeAccessModes(dataVolume),
            volumeMode: getDataVolumeVolumeMode(dataVolume),
            size: getDataVolumeStorageSize(dataVolume),
            storageClassName: getDataVolumeStorageClassName(dataVolume),
          }).build();

          this.vm.ensureDataVolumeTemplates().push(clonedDVTemplate);

          volume.dataVolume = {
            name: getName(clonedDVTemplate),
          };
        }
      });
    return this;
  };

  build() {
    const result = this.vm.asResource(true);
    // in case withClonedPVCs was not called
    if (this.vm.getVolumes(null)) {
      result.spec.template.spec.volumes = result.spec.template.spec.volumes.filter(
        (v) => !getVolumePersistentVolumeClaimName(v),
      );
    }
    return result;
  }
}
