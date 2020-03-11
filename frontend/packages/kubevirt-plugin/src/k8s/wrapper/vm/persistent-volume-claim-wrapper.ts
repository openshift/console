import { validate } from '@console/internal/components/utils';
import { V1PersistentVolumeClaim } from '../../../types/vm/disk/V1PersistentVolumeClaim';
import {
  getPvcAccessModes,
  getPvcStorageClassName,
  getPvcStorageSize,
  getPvcVolumeMode,
} from '../../../selectors/pvc/selectors';
import { toIECUnit } from '../../../components/form/size-unit-utils';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { AccessMode, VolumeMode } from '../../../constants/vm/storage';

export class PersistentVolumeClaimWrapper extends K8sResourceWrapper<
  V1PersistentVolumeClaim,
  PersistentVolumeClaimWrapper
> {
  constructor(
    persistentVolumeClaim?: V1PersistentVolumeClaim | PersistentVolumeClaimWrapper | any,
    copy = false,
  ) {
    super(PersistentVolumeClaimModel, persistentVolumeClaim, copy);
  }

  init(
    data: K8sInitAddon & { size?: string | number; unit?: string; storageClassName?: string } = {},
  ) {
    super.init(data);
    const { size, unit, storageClassName } = data;
    if (size && unit) {
      this.setSize(size, unit);
    }
    if (storageClassName !== undefined) {
      this.setStorageClassName(storageClassName);
    }

    return this;
  }

  getStorageClassName = () => getPvcStorageClassName(this.data as any);

  getSize = (): { value: number; unit: string } => {
    const parts = validate.split(getPvcStorageSize(this.data as any) || '');
    return {
      value: parts[0],
      unit: parts[1],
    };
  };

  getReadabableSize = () => {
    const { value, unit } = this.getSize();
    return `${value} ${toIECUnit(unit)}`;
  };

  hasSize = () => this.getSize().value > 0;

  getAccessModes = () => getPvcAccessModes(this.data);

  getVolumeMode = () => getPvcVolumeMode(this.data);

  getVolumeModeEnum = () => VolumeMode.fromString(this.getVolumeMode());

  getAccessModesEnum = () => {
    const accessModes = this.getAccessModes();
    return accessModes ? accessModes.map((mode) => AccessMode.fromString(mode)) : accessModes;
  };

  setSize = (value: string | number, unit = 'Gi') => {
    this.ensurePath('spec.resources.requests');
    (this.data.spec.resources.requests as any).storage = `${value}${unit}`;
    return this;
  };

  setStorageClassName = (storageClassName: string) => {
    this.ensurePath('spec');
    this.data.spec.storageClassName = storageClassName;
    return this;
  };

  setAccessModes = (accessModes: string[]) => {
    this.ensurePath('spec');
    this.data.spec.accessModes = accessModes;
    return this;
  };

  addAccessMode = (accessMode: string) => {
    if (accessMode) {
      this.ensurePath('spec.accessModes', []);
      (this.data.spec.accessModes as string[]).push(accessMode);
    }
    return this;
  };

  setVolumeMode = (volumeMode: string) => {
    this.ensurePath('spec');
    this.data.spec.volumeMode = volumeMode || undefined;
    return this;
  };

  assertDefaultModes = (volumeMode: VolumeMode, accessModes: AccessMode[]) => {
    const oldAccessModes = this.getAccessModes();
    if ((!oldAccessModes || oldAccessModes.length === 0) && accessModes) {
      this.setAccessModes(accessModes.map((a) => a.toString()));
    }

    if (!this.getVolumeMode() && volumeMode) {
      this.setVolumeMode(volumeMode.toString());
    }

    return this;
  };

  mergeWith(...pvcWrappers: PersistentVolumeClaimWrapper[]) {
    super.mergeWith(...pvcWrappers);
    this.clearIfEmpty('spec.storageClassName');
    return this;
  }
}
