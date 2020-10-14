import { V1PersistentVolumeClaim } from '../../../types/vm/disk/V1PersistentVolumeClaim';
import {
  getPvcAccessModes,
  getPvcStorageClassName,
  getPvcStorageSize,
  getPvcVolumeMode,
} from '../../../selectors/pvc/selectors';
import {
  BinaryUnit,
  stringValueUnitSplit,
  toIECUnit,
} from '../../../components/form/size-unit-utils';
import { K8sResourceWrapper } from '../common/k8s-resource-wrapper';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { K8sInitAddon } from '../common/util/k8s-mixin';
import { AccessMode, VolumeMode } from '../../../constants/vm/storage';
import { PersistentVolumeClaimKind } from '@console/internal/module/k8s';

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

  init(data: K8sInitAddon & { size?: string | number; unit?: string; storageClassName?: string }) {
    super.init(data);
    const { size, unit, storageClassName } = data || {};
    if (size != null && unit) {
      this.setSize(size, unit);
    }
    if (storageClassName !== undefined) {
      this.setStorageClassName(storageClassName);
    }

    return this;
  }

  getStorageClassName = () => getPvcStorageClassName(this.data as any);

  getSize = (): { value: number; unit: string } => {
    const parts = stringValueUnitSplit(getPvcStorageSize(this.data as any) || '');
    return {
      value: parts[0],
      unit: parts[1],
    };
  };

  getReadabableSize = () => {
    const { value, unit } = this.getSize();
    return `${value} ${toIECUnit(unit) || BinaryUnit.B}`;
  };

  hasSize = () => this.getSize().value > 0;

  getAccessModes = () => getPvcAccessModes(this.data as PersistentVolumeClaimKind);

  getVolumeMode = () => getPvcVolumeMode(this.data as PersistentVolumeClaimKind);

  getVolumeModeEnum = () => VolumeMode.fromString(this.getVolumeMode());

  getAccessModesEnum = () => {
    const accessModes = this.getAccessModes();
    return accessModes?.map((mode) => AccessMode.fromString(mode)) ?? [];
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

  setAccessModes = (accessModes: AccessMode[]) => {
    this.ensurePath('spec');
    this.data.spec.accessModes =
      accessModes && accessModes.map((a) => a?.getValue()).filter((a) => a); // allow null and undefined
    return this;
  };

  setVolumeMode = (volumeMode: VolumeMode) => {
    this.ensurePath('spec');
    this.data.spec.volumeMode = volumeMode && volumeMode.getValue(); // allow null and undefined
    return this;
  };

  mergeWith(...pvcWrappers: PersistentVolumeClaimWrapper[]) {
    super.mergeWith(...pvcWrappers);
    this.clearIfEmpty('spec.storageClassName');
    this.clearIfEmpty('spec.accessModes');
    this.clearIfEmpty('spec.volumeMode');
    const accessModes = this.getAccessModesEnum();
    if (accessModes?.length > 1) {
      // API currently allows only one mode
      this.setAccessModes([accessModes[0]]);
    }
    return this;
  }
}
