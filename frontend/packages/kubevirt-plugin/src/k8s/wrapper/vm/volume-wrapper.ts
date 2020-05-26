import { K8sKind } from '@console/internal/module/k8s';
import {
  ConfigMapModel,
  PersistentVolumeClaimModel,
  SecretModel,
  ServiceAccountModel,
} from '@console/internal/models';
import { ObjectWithTypePropertyWrapper } from '../common/object-with-type-property-wrapper';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { VolumeType } from '../../../constants/vm/storage';
import {
  getVolumeContainerImage,
  getVolumeDataVolumeName,
  getVolumePersistentVolumeClaimName,
} from '../../../selectors/vm/volume';
import { DataVolumeModel } from '../../../models';
import { V1LocalObjectReference } from '../../../types/vm/disk/V1LocalObjectReference';
import * as _ from 'lodash';

export type VolumeReferencedObject = {
  name: string;
  model: K8sKind;
};

const getVolumeReferencedObject = (volume: VolumeWrapper): VolumeReferencedObject => {
  const typeData = volume.getTypeData();
  let name;
  switch (volume.getType()) {
    case VolumeType.CLOUD_INIT_CONFIG_DRIVE:
    case VolumeType.CLOUD_INIT_NO_CLOUD:
      name = typeData.networkDataSecretRef?.name || typeData.secretRef?.name;
      return (
        name && {
          name,
          model: SecretModel,
        }
      );
    case VolumeType.CONFIG_MAP:
      return {
        name: typeData.name,
        model: ConfigMapModel,
      };
    case VolumeType.DATA_VOLUME:
      return {
        name: typeData.name,
        model: DataVolumeModel,
      };
    case VolumeType.EPHEMERAL:
      return {
        name: typeData.persistentVolumeClaim?.claimName,
        model: PersistentVolumeClaimModel,
      };
    case VolumeType.PERSISTENT_VOLUME_CLAIM:
      return {
        name: typeData.claimName,
        model: PersistentVolumeClaimModel,
      };
    case VolumeType.SECRET:
      return {
        name: typeData.secretName,
        model: SecretModel,
      };
    case VolumeType.SERVICE_ACCOUNT:
      return {
        name: typeData.serviceAccountName,
        model: ServiceAccountModel,
      };
    default:
      return null;
  }
};

type CombinedTypeData = {
  name?: string;
  claimName?: string;
  image?: string;
  userData?: string;
  userDataBase64?: string;
  persistentVolumeClaim?: {
    claimName: string;
  };
  secretName?: string;
  serviceAccountName?: string;
  networkDataSecretRef?: V1LocalObjectReference;
  secretRef?: V1LocalObjectReference;
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

  init({ name }: { name?: string }) {
    if (name !== undefined) {
      this.data.name = name;
    }
    return this;
  }

  getName = () => this.get('name');

  getCloudInitNoCloud = () => this.get('cloudInitNoCloud');

  getPersistentVolumeClaimName = () => getVolumePersistentVolumeClaimName(this.data);

  getDataVolumeName = () => getVolumeDataVolumeName(this.data);

  getContainerImage = () => getVolumeContainerImage(this.data);

  getReferencedObject = () => getVolumeReferencedObject(this);

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

  isVolumeEqual = (otherVolume: V1Volume, omitRuntimeData?: boolean) => {
    if (!otherVolume) {
      return false;
    }

    if (!omitRuntimeData) {
      return _.isEqual(this.data, otherVolume);
    }

    const volWrapper = new VolumeWrapper(otherVolume);
    const thisType = this.getType();

    if (thisType !== volWrapper.getType()) {
      return false;
    }

    switch (thisType) {
      case VolumeType.CONTAINER_DISK:
        return _.isEqual(
          _.omit(this.data, 'containerDisk.imagePullPolicy'),
          _.omit(otherVolume, 'containerDisk.imagePullPolicy'),
        );
      default:
        return _.isEqual(this.data, otherVolume);
    }
  };
}
