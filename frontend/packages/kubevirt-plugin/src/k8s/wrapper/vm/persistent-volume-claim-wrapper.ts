import * as _ from 'lodash';
import { getName } from '@console/shared/src';
import { validate } from '@console/internal/components/utils';
import { Wrapper } from '../common/wrapper';
import { V1PersistentVolumeClaim } from '../../../types/vm/disk/V1PersistentVolumeClaim';
import {
  getPvcAccessModes,
  getPvcStorageClassName,
  getPvcStorageSize,
  getPvcVolumeMode,
} from '../../../selectors/pvc/selectors';
import { toIECUnit } from '../../../components/form/size-unit-utils';

export class PersistentVolumeClaimWrapper extends Wrapper<V1PersistentVolumeClaim> {
  static readonly EMPTY = new PersistentVolumeClaimWrapper();

  static mergeWrappers = (
    ...persistentVolumeWrappers: PersistentVolumeClaimWrapper[]
  ): PersistentVolumeClaimWrapper =>
    Wrapper.defaultMergeWrappers(PersistentVolumeClaimWrapper, persistentVolumeWrappers);

  static initializeFromSimpleData = (params?: {
    name?: string;
    accessModes?: object[] | string[];
    volumeMode?: object | string;
    size?: string | number;
    unit?: string;
    storageClassName?: string;
  }) => {
    if (!params) {
      return PersistentVolumeClaimWrapper.EMPTY;
    }
    const { name, accessModes, volumeMode, size, unit, storageClassName } = params;
    const resources =
      size == null
        ? undefined
        : {
            requests: {
              storage: size && unit ? `${size}${unit}` : size,
            },
          };

    return new PersistentVolumeClaimWrapper({
      metadata: {
        name,
      },
      spec: {
        accessModes: _.cloneDeep(accessModes),
        volumeMode: _.cloneDeep(volumeMode),
        resources,
        storageClassName,
      },
    });
  };

  static initialize = (persistentVolumeClaim?: V1PersistentVolumeClaim, copy?: boolean) =>
    new PersistentVolumeClaimWrapper(persistentVolumeClaim, copy && { copy });

  protected constructor(
    persistentVolumeClaim?: V1PersistentVolumeClaim,
    opts?: {
      copy?: boolean;
    },
  ) {
    super(persistentVolumeClaim, opts);
  }

  getName = () => getName(this.data as any);

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
}
