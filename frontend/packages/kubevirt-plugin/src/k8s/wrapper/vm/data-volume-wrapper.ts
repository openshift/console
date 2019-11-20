import * as _ from 'lodash';
import { getName } from '@console/shared/src';
import { validate } from '@console/internal/components/utils';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { DataVolumeSourceType } from '../../../constants/vm/storage';
import {
  getDataVolumeAccessModes,
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
  getDataVolumeVolumeMode,
} from '../../../selectors/dv/selectors';
import { toIECUnit } from '../../../components/form/size-unit-utils';

type CombinedTypeData = {
  name?: string;
  namespace?: string;
  url?: string;
};

const sanitizeTypeData = (type: DataVolumeSourceType, typeData: CombinedTypeData) => {
  if (!type || !typeData) {
    return null;
  }
  const { name, namespace, url } = typeData;

  if (type === DataVolumeSourceType.BLANK) {
    return {};
  }
  if (type === DataVolumeSourceType.HTTP) {
    return { url };
  }
  if (type === DataVolumeSourceType.PVC) {
    return { name, namespace };
  }

  return null;
};

export class DataVolumeWrapper extends ObjectWithTypePropertyWrapper<
  V1alpha1DataVolume,
  DataVolumeSourceType
> {
  static readonly EMPTY = new DataVolumeWrapper();

  static mergeWrappers = (...datavolumeWrappers: DataVolumeWrapper[]): DataVolumeWrapper =>
    ObjectWithTypePropertyWrapper.defaultMergeWrappersWithType(
      DataVolumeWrapper,
      datavolumeWrappers,
    );

  static initializeFromSimpleData = (
    params?: {
      name?: string;
      type?: DataVolumeSourceType;
      typeData?: CombinedTypeData;
      accessModes?: object[] | string[];
      volumeMode?: object | string;
      size?: string | number;
      unit?: string;
      storageClassName?: string;
    },
    opts?: { sanitizeTypeData: boolean },
  ) => {
    if (!params) {
      return DataVolumeWrapper.EMPTY;
    }
    const { name, type, typeData, accessModes, volumeMode, size, unit, storageClassName } = params;
    const resources =
      size == null
        ? undefined
        : {
            requests: {
              storage: size && unit ? `${size}${unit}` : size,
            },
          };

    return new DataVolumeWrapper(
      {
        metadata: {
          name,
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
      },
      {
        initializeWithType: type,
        initializeWithTypeData:
          opts && opts.sanitizeTypeData ? sanitizeTypeData(type, typeData) : _.cloneDeep(typeData),
      },
    );
  };

  static initialize = (dataVolumeTemplate?: V1alpha1DataVolume, copy?: boolean) =>
    new DataVolumeWrapper(dataVolumeTemplate, copy && { copy });

  protected constructor(
    dataVolumeTemplate?: V1alpha1DataVolume,
    opts?: {
      initializeWithType?: DataVolumeSourceType;
      initializeWithTypeData?: any;
      copy?: boolean;
    },
  ) {
    super(dataVolumeTemplate, opts, DataVolumeSourceType, ['spec', 'source']);
  }

  getName = () => getName(this.data as any);

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
}
