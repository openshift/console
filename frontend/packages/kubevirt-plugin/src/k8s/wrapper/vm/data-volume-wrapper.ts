import { getOwnerReferences } from '@console/shared/src';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { AccessMode, DataVolumeSourceType, VolumeMode } from '../../../constants/vm/storage';
import {
  getDataVolumeAccessModes,
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
  getDataVolumeVolumeMode,
} from '../../../selectors/dv/selectors';
import {
  BinaryUnit,
  stringValueUnitSplit,
  toIECUnit,
} from '../../../components/form/size-unit-utils';
import { DataVolumeModel } from '../../../models';
import { K8sResourceObjectWithTypePropertyWrapper } from '../common/k8s-resource-object-with-type-property-wrapper';
import { K8sInitAddon } from '../common/util/k8s-mixin';

type CombinedTypeData = {
  name?: string;
  namespace?: string;
  url?: string;
};

export class DataVolumeWrapper extends K8sResourceObjectWithTypePropertyWrapper<
  V1alpha1DataVolume,
  DataVolumeSourceType,
  CombinedTypeData,
  DataVolumeWrapper
> {
  constructor(dataVolumeTemplate?: V1alpha1DataVolume | DataVolumeWrapper, copy = false) {
    super(DataVolumeModel, dataVolumeTemplate, copy, DataVolumeSourceType, ['spec', 'source']);
  }

  init(
    data: K8sInitAddon & { size?: string | number; unit?: string; storageClassName?: string } = {},
  ) {
    super.init(data);
    const { size, unit, storageClassName } = data;
    if (size != null && unit) {
      this.setSize(size, unit);
    }
    if (storageClassName !== undefined) {
      this.setStorageClassName(storageClassName);
    }
    return this;
  }

  getStorageClassName = () => getDataVolumeStorageClassName(this.data as any);

  getPesistentVolumeClaimName = () => this.getIn(['spec', 'source', 'pvc', 'name']);

  getPesistentVolumeClaimNamespace = () => this.getIn(['spec', 'source', 'pvc', 'namespace']);

  getURL = () => this.getIn(['spec', 'source', 'http', 'url']);

  getContainer = () => this.getIn(['spec', 'source', 'registry', 'url']);

  getSize = (): { value: number; unit: string } => {
    const parts = stringValueUnitSplit(getDataVolumeStorageSize(this.data as any) || '');
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

  getAccessModes = () => getDataVolumeAccessModes(this.data);

  getVolumeMode = () => getDataVolumeVolumeMode(this.data);

  getVolumeModeEnum = () => VolumeMode.fromString(this.getVolumeMode());

  getAccessModesEnum = () => {
    const accessModes = this.getAccessModes();
    return accessModes ? accessModes.map((mode) => AccessMode.fromString(mode)) : accessModes;
  };

  setSize = (value: string | number, unit = 'Gi') => {
    this.ensurePath('spec.pvc.resources.requests');
    (this.data.spec.pvc.resources.requests as any).storage = `${value}${unit}`;
    return this;
  };

  setRawSize = (value: string) => {
    this.ensurePath('spec.pvc.resources.requests');
    (this.data.spec.pvc.resources.requests as any).storage = value;
    return this;
  };

  setStorageClassName = (storageClassName: string) => {
    this.ensurePath('spec.pvc');
    this.data.spec.pvc.storageClassName = storageClassName;
    return this;
  };

  setAccessModes = (accessModes: AccessMode[]) => {
    this.ensurePath('spec.pvc');
    this.data.spec.pvc.accessModes =
      accessModes && accessModes.map((a) => a?.getValue()).filter((a) => a); // allow null and undefined
    return this;
  };

  setVolumeMode = (volumeMode: VolumeMode) => {
    this.ensurePath('spec.pvc');
    this.data.spec.pvc.volumeMode = volumeMode && volumeMode.getValue(); // allow null and undefined
    return this;
  };

  addOwnerReferences = (...additionalOwnerReferences) => {
    if (!getOwnerReferences(this.data)) {
      this.data.metadata.ownerReferences = [];
    }

    if (additionalOwnerReferences) {
      const ownerReferences = getOwnerReferences(this.data);
      additionalOwnerReferences.forEach((newReference) => {
        if (
          !ownerReferences.some((oldReference) => compareOwnerReference(oldReference, newReference))
        ) {
          ownerReferences.push(newReference);
        }
      });
    }
    return this;
  };

  mergeWith(...dataVolumeWrappers: DataVolumeWrapper[]) {
    super.mergeWith(...dataVolumeWrappers);
    this.clearIfEmpty('spec.pvc.storageClassName');
    this.clearIfEmpty('spec.pvc.accessModes');
    this.clearIfEmpty('spec.pvc.volumeMode');
    const accessModes = this.getAccessModesEnum();
    if (accessModes?.length > 1) {
      // API currently allows only one mode
      this.setAccessModes([accessModes[0]]);
    }
    return this;
  }

  protected sanitize(type: DataVolumeSourceType, { name, namespace, url }: CombinedTypeData) {
    switch (type) {
      case DataVolumeSourceType.HTTP:
      case DataVolumeSourceType.REGISTRY:
        return { url };
      case DataVolumeSourceType.PVC:
        return { name, namespace };
      case DataVolumeSourceType.BLANK:
      default:
        return {};
    }
  }
}
