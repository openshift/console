import { K8sResourceKind } from '@console/internal/module/k8s';
import { createBasicLookup, getName, getNamespace } from '@console/shared';
import { VMKind } from '../../../../types/vm';
import { getBasicID, joinIDs } from '../../../../utils';
import {
  getPvcAccessModes,
  getPvcStorageClassName,
  getPvcStorageSize,
} from '../../../../selectors/pvc/selectors';
import { DataVolumeTemplate } from '../datavolume-template';
import {
  getOperatingSystem,
  getOperatingSystemName,
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
} from '../../../../selectors/vm';
import {
  getDataVolumeAccessModes,
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
} from '../../../../selectors/dv/selectors';
import { TEMPLATE_OS_NAME_ANNOTATION, TEMPLATE_VM_NAME_LABEL } from '../../../../constants/vm';
import { SafeVM } from './safe-vm';

export type CloneTo = {
  name: string;
  namespace: string;
  description: string;
  startVM?: boolean;
};

export class VMClone extends SafeVM {
  private oldVMNamespace: string;

  constructor(vm: VMKind, values: CloneTo) {
    super(vm);
    this.oldVMNamespace = getNamespace(vm);
    this.cleanVM();
    this.setValues(values);
  }

  private cleanVM = () => {
    const { metadata, spec } = this.data;

    delete metadata.selfLink;
    delete metadata.resourceVersion;
    delete metadata.uid;
    delete metadata.creationTimestamp;
    delete metadata.generation;
    delete spec.template.spec.domain.firmware;
    delete this.data.status;
    spec.dataVolumeTemplates = [];

    this.getInterfaces().forEach((intface) => delete intface.macAddress);
  };

  private setValues({ name, namespace, description, startVM = false }: CloneTo) {
    const { metadata } = this.data;
    const osId = getOperatingSystem(this.data);
    const osName = getOperatingSystemName(this.data);

    this.data.spec.running = startVM;
    metadata.name = name;
    metadata.namespace = namespace;
    metadata.annotations = {};

    if (description) {
      metadata.annotations.description = description;
    }
    if (osId && osName) {
      metadata.annotations[`${TEMPLATE_OS_NAME_ANNOTATION}/${osId}`] = osName;
    }

    this.getTemplateLabels()[TEMPLATE_VM_NAME_LABEL] = name;
    return this;
  }

  withClonedPVCs = (persistentVolumeClaimsToClone: K8sResourceKind[]) => {
    const pvcLookup = createBasicLookup(persistentVolumeClaimsToClone, getBasicID);
    const name = getName(this.data);

    this.getVolumes()
      .filter(getVolumePersistentVolumeClaimName)
      .forEach((volume) => {
        const pvcName = getVolumePersistentVolumeClaimName(volume);
        delete volume.persistentVolumeClaim;

        const pvc = pvcLookup[`${this.oldVMNamespace}-${pvcName}`];

        if (pvc) {
          const clonedDVTemplate = new DataVolumeTemplate({
            name: joinIDs(name, pvcName, 'clone'),
            pvcSourceName: pvcName,
            pvcSourceNamespace: this.oldVMNamespace,
            accessModes: getPvcAccessModes(pvc),
            size: getPvcStorageSize(pvc),
            storageClassName: getPvcStorageClassName(pvc),
          }).build();

          this.getDataVolumeTemplates().push(clonedDVTemplate);

          volume.dataVolume = {
            name: getName(clonedDVTemplate),
          };
        }
      });
    return this;
  };

  withClonedDataVolumes = (dataVolumes: K8sResourceKind[]) => {
    const dvLookup = createBasicLookup(dataVolumes, getBasicID);
    const name = getName(this.data);

    this.getVolumes()
      .filter(getVolumeDataVolumeName)
      .forEach((volume) => {
        const dvName = getVolumeDataVolumeName(volume);
        const dataVolume = dvLookup[`${this.oldVMNamespace}-${dvName}`];

        if (dataVolume) {
          const clonedDVTemplate = new DataVolumeTemplate({
            name: joinIDs(name, dvName, 'clone'),
            pvcSourceName: dvName,
            pvcSourceNamespace: this.oldVMNamespace,
            accessModes: getDataVolumeAccessModes(dataVolume),
            size: getDataVolumeStorageSize(dataVolume),
            storageClassName: getDataVolumeStorageClassName(dataVolume),
          }).build();

          this.getDataVolumeTemplates().push(clonedDVTemplate);

          volume.dataVolume = {
            name: getName(clonedDVTemplate),
          };
        }
      });
    return this;
  };

  build() {
    const result = super.buildClean();
    // in case withClonedPVCs was not called
    result.spec.template.spec.volumes = result.spec.template.spec.volumes.filter(
      (v) => !getVolumePersistentVolumeClaimName(v),
    );
    return result;
  }
}
