import * as _ from 'lodash';
import { getOwnerReferences } from '@console/shared/src';
import { validate } from '@console/internal/components/utils';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { apiVersionForModel } from '@console/internal/module/k8s';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { AccessMode, DataVolumeSourceType, VolumeMode } from '../../../constants/vm/storage';
import {
  getDataVolumeAccessModes,
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
  getDataVolumeVolumeMode,
} from '../../../selectors/dv/selectors';
import { toIECUnit } from '../../../components/form/size-unit-utils';
import { DataVolumeModel } from '../../../models';
import { K8sResourceObjectWithTypePropertyWrapper } from '../common/k8s-resource-object-with-type-property-wrapper';

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
  /**
   * @deprecated FIXME deprecate initializeFromSimpleData in favor of init
   */
  static initializeFromSimpleData = ({
    name,
    namespace,
    type,
    typeData,
    accessModes,
    volumeMode,
    size,
    unit,
    storageClassName,
  }: {
    name?: string;
    namespace?: string;
    type?: DataVolumeSourceType;
    typeData?: CombinedTypeData;
    accessModes?: object[] | string[];
    volumeMode?: object | string;
    size?: string | number;
    unit?: string;
    storageClassName?: string;
  }) => {
    const resources =
      size == null
        ? undefined
        : {
            requests: {
              storage: size && unit ? `${size}${unit}` : size,
            },
          };

    return new DataVolumeWrapper({
      apiVersion: apiVersionForModel(DataVolumeModel),
      kind: DataVolumeModel.kind,
      metadata: {
        name,
        namespace,
      },
      spec: {
        pvc: {
          accessModes: _.cloneDeep(accessModes),
          volumeMode: _.cloneDeep(volumeMode),
          resources,
          storageClassName,
        },
        source: {},
      },
    }).setType(type, typeData);
  };

  constructor(dataVolumeTemplate?: V1alpha1DataVolume | DataVolumeWrapper, copy = false) {
    super(DataVolumeModel, dataVolumeTemplate, copy, DataVolumeSourceType, ['spec', 'source']);
  }

  getStorageClassName = () => getDataVolumeStorageClassName(this.data as any);

  getPesistentVolumeClaimName = () => this.getIn(['spec', 'source', 'pvc', 'name']);

  getPesistentVolumeClaimNamespace = () => this.getIn(['spec', 'source', 'pvc', 'namespace']);

  getURL = () => this.getIn(['spec', 'source', 'http', 'url']);

  getSize = (): { value: number; unit: string } => {
    const parts = validate.split(getDataVolumeStorageSize(this.data as any) || '');
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

  getAccessModes = () => getDataVolumeAccessModes(this.data);

  getVolumeMode = () => getDataVolumeVolumeMode(this.data);

  getVolumeModeEnum = () => VolumeMode.fromString(this.getVolumeMode());

  getAccessModesEnum = () => {
    const accessModes = this.getAccessModes();
    return accessModes ? accessModes.map((mode) => AccessMode.fromString(mode)) : accessModes;
  };

  setAccessModes = (accessModes: string[]) => {
    this.ensurePath('spec.pvc');
    this.data.spec.pvc.accessModes = accessModes;
    return this;
  };

  setVolumeMode = (volumeMode: string) => {
    this.ensurePath('spec.pvc');
    this.data.spec.pvc.volumeMode = volumeMode || undefined;
    return this;
  };

  addAccessMode = (accessMode: string) => {
    if (accessMode) {
      this.ensurePath('spec.pvc.accessModes', []);
      (this.data.spec.pvc.accessModes as string[]).push(accessMode);
    }
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
    return this;
  }

  protected sanitize(type: DataVolumeSourceType, { name, namespace, url }: CombinedTypeData) {
    switch (type) {
      case DataVolumeSourceType.HTTP:
        return { url };
      case DataVolumeSourceType.PVC:
        return { name, namespace };
      case DataVolumeSourceType.BLANK:
      default:
        return {};
    }
  }
}
