import * as _ from 'lodash';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { VolumeType } from '../../../constants/vm/storage';
import {
  getVolumeContainerImage,
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
} from '../../../selectors/vm/volume';

type CombinedTypeData = {
  name?: string;
  claimName?: string;
  image?: string;
  userData?: string;
  userDataBase64?: string;
};

const sanitizeTypeData = (type: VolumeType, typeData: CombinedTypeData) => {
  if (!type || !typeData) {
    return null;
  }
  const { name, claimName, image, userData, userDataBase64 } = typeData;

  if (type === VolumeType.DATA_VOLUME) {
    return { name };
  }
  if (type === VolumeType.PERSISTENT_VOLUME_CLAIM) {
    return { claimName };
  }

  if (type === VolumeType.CONTAINER_DISK) {
    return { image };
  }

  if (type === VolumeType.CLOUD_INIT_NO_CLOUD) {
    return userDataBase64 ? { userDataBase64 } : { userData };
  }

  return null;
};

export class VolumeWrapper extends ObjectWithTypePropertyWrapper<V1Volume, VolumeType> {
  static readonly EMPTY = new VolumeWrapper();

  static mergeWrappers = (...volumes: VolumeWrapper[]): VolumeWrapper =>
    ObjectWithTypePropertyWrapper.defaultMergeWrappersWithType(VolumeWrapper, volumes);

  static initializeFromSimpleData = (
    params?: {
      name?: string;
      type?: VolumeType;
      typeData?: CombinedTypeData;
    },
    opts?: { sanitizeTypeData: boolean },
  ) => {
    if (!params) {
      return VolumeWrapper.EMPTY;
    }
    const { name, type, typeData } = params;
    return new VolumeWrapper(
      { name },
      {
        initializeWithType: type,
        initializeWithTypeData:
          opts && opts.sanitizeTypeData ? sanitizeTypeData(type, typeData) : _.cloneDeep(typeData),
      },
    );
  };

  static initialize = (volume?: V1Volume, copy?: boolean) =>
    new VolumeWrapper(volume, copy && { copy });

  protected constructor(
    volume?: V1Volume,
    opts?: { initializeWithType?: VolumeType; initializeWithTypeData?: any; copy?: boolean },
  ) {
    super(volume, opts, VolumeType);
  }

  getName = () => this.get('name');

  getCloudInitNoCloud = () => this.get('cloudInitNoCloud');

  getPersistentVolumeClaimName = () => getVolumePersistentVolumeClaimName(this.data);

  getDataVolumeName = () => getVolumeDataVolumeName(this.data);

  getContainerImage = () => getVolumeContainerImage(this.data);
}

export class MutableVolumeWrapper extends VolumeWrapper {
  public constructor(volume?: V1Volume, copy = false) {
    super(volume, { copy });
  }

  replaceType = (type: VolumeType, typeData: CombinedTypeData, sanitize = true) => {
    this.setType(type, sanitize ? sanitizeTypeData(type, typeData) : typeData);
    return this;
  };

  setTypeData = (typeData: CombinedTypeData, sanitize = true) =>
    this.replaceType(this.getType(), typeData, sanitize);

  appendTypeData = (typeData: CombinedTypeData, sanitize = true) => {
    this.addTypeData(sanitize ? sanitizeTypeData(this.getType(), typeData) : typeData);
    return this;
  };

  asMutableResource = () => this.data;
}
