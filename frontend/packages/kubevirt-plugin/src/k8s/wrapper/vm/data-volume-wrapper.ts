import * as _ from 'lodash';
import { getName, getNamespace, getOwnerReferences } from '@console/shared/src';
import { validate } from '@console/internal/components/utils';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';
import { apiVersionForModel } from '@console/internal/module/k8s';
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
import { DataVolumeModel } from '../../../models';
import { ensurePath } from '../utils/utils';

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
      namespace?: string;
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
    const {
      name,
      namespace,
      type,
      typeData,
      accessModes,
      volumeMode,
      size,
      unit,
      storageClassName,
    } = params;
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

  getNamespace = () => getNamespace(this.data as any);

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

export class MutableDataVolumeWrapper extends DataVolumeWrapper {
  public constructor(dataVolume?: V1alpha1DataVolume, copy = false) {
    super(dataVolume, { copy });
  }

  setName = (name: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.name = name;
    return this;
  };

  setNamespace = (namespace: string) => {
    this.ensurePath('metadata', {});
    this.data.metadata.namespace = namespace;
    return this;
  };

  setAccessModes = (accessModes: string[]) => {
    this.ensurePath('spec.pvc', {});
    this.data.spec.pvc.accessModes = accessModes;
    return this;
  };

  setVolumeMode = (volumeMode: string) => {
    this.ensurePath('spec.pvc', {});
    this.data.spec.pvc.volumeMode = volumeMode;
    return this;
  };

  assertDefaultModes = (volumeMode: string, accessModes: string[]) => {
    const oldAccessModes = this.getAccessModes();
    if ((!oldAccessModes || oldAccessModes.length === 0) && accessModes) {
      this.setAccessModes(accessModes);
    }

    if (!this.getVolumeMode() && volumeMode) {
      this.setVolumeMode(volumeMode);
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

  appendTypeData = (typeData: CombinedTypeData, sanitize = true) => {
    this.addTypeData(sanitize ? sanitizeTypeData(this.getType(), typeData) : typeData);
    return this;
  };

  ensurePath = (path: string[] | string, value) => ensurePath(this.data, path, value);

  asMutableResource = () => this.data;
}
