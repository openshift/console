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

export class VolumeWrapper extends ObjectWithTypePropertyWrapper<
  V1Volume,
  VolumeType,
  CombinedTypeData,
  VolumeWrapper
> {
  /**
   * @deprecated FIXME deprecate initializeFromSimpleData in favor of init
   */
  static initializeFromSimpleData = ({
    name,
    type,
    typeData,
  }: {
    name?: string;
    type?: VolumeType;
    typeData?: CombinedTypeData;
  }) => new VolumeWrapper({ name }).setType(type, typeData);

  constructor(volume?: V1Volume | VolumeWrapper, copy = false) {
    super(volume, copy, VolumeType);
  }

  getName = () => this.get('name');

  getCloudInitNoCloud = () => this.get('cloudInitNoCloud');

  getPersistentVolumeClaimName = () => getVolumePersistentVolumeClaimName(this.data);

  getDataVolumeName = () => getVolumeDataVolumeName(this.data);

  getContainerImage = () => getVolumeContainerImage(this.data);

  protected sanitize(
    type: VolumeType,
    { name, claimName, image, userData, userDataBase64 }: CombinedTypeData,
  ): CombinedTypeData {
    switch (type) {
      case VolumeType.DATA_VOLUME:
        return { name };
      case VolumeType.PERSISTENT_VOLUME_CLAIM:
        return { claimName };
      case VolumeType.CONTAINER_DISK:
        return { image };
      case VolumeType.CLOUD_INIT_NO_CLOUD:
        return userDataBase64 ? { userDataBase64 } : { userData };
      default:
        return null;
    }
  }
}
