/* eslint-disable lines-between-class-members */
import { getName, getNamespace, K8sEntityMap } from '@console/shared/src';
import { ObjectEnum } from '../object-enum';
import {
  asVM,
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getVolumeDataVolumeName,
  getVolumes,
} from '../../selectors/vm';
import { VMLikeEntityKind } from '../../types/vmLike';
import { StorageUISource } from '../../components/modals/disk-modal/storage-ui-source';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VolumeType } from './storage';
import {
  PROVISION_SOURCE_PXE_DESC,
  PROVISION_SOURCE_CONTAINER_DESC,
  PROVISION_SOURCE_URL_DESC,
  PROVISION_SOURCE_DISK_DESC,
} from '../../utils/strings';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';

type ProvisionSourceDetails = {
  type?: ProvisionSource;
  source?: string;
  error?: string;
};

export class ProvisionSource extends SelectDropdownObjectEnum<string> {
  static readonly URL = new ProvisionSource('URL', {
    label: 'URL (adds disk)',
    description: PROVISION_SOURCE_URL_DESC,
    order: 1,
  });
  static readonly DISK = new ProvisionSource('Disk', {
    label: 'Existing PVC (adds disk)',
    description: PROVISION_SOURCE_DISK_DESC,
    order: 2,
  });
  static readonly CONTAINER = new ProvisionSource('Container', {
    label: 'Container',
    description: PROVISION_SOURCE_CONTAINER_DESC,
    order: 3,
  });
  static readonly PXE = new ProvisionSource('PXE', {
    label: 'PXE (network boot - adds network interface)',
    description: PROVISION_SOURCE_PXE_DESC,
    order: 4,
  });

  private static readonly ALL = Object.freeze(
    ObjectEnum.getAllClassEnumProperties<ProvisionSource>(ProvisionSource),
  );

  private static readonly stringMapper = ProvisionSource.ALL.reduce(
    (accumulator, provisionSource: ProvisionSource) => ({
      ...accumulator,
      [provisionSource.value]: provisionSource,
    }),
    {},
  );

  static getAll = () => ProvisionSource.ALL;

  static fromString = (source: string): ProvisionSource => ProvisionSource.stringMapper[source];

  static getProvisionSourceDetails = (
    vmLikeEntity: VMLikeEntityKind,
    {
      convertTemplateDataVolumesToAttachClonedDisk,
      dataVolumes,
      dataVolumeLookup,
    }: {
      convertTemplateDataVolumesToAttachClonedDisk?: boolean;
      dataVolumes?: V1alpha1DataVolume[];
      dataVolumeLookup?: K8sEntityMap<V1alpha1DataVolume>;
    } = {},
  ): ProvisionSourceDetails => {
    const vm = asVM(vmLikeEntity);
    if (getInterfaces(vm).some((i) => i.bootOrder === 1)) {
      return {
        type: ProvisionSource.PXE,
      };
    }

    const bootDisk = getDisks(vm).find((disk) => disk.bootOrder === 1);
    if (bootDisk) {
      const volume = getVolumes(vm).find((vol) => vol.name === bootDisk.name);
      if (!volume) {
        return {
          error: 'No Volume has been found.',
        };
      }
      const volumeWrapper = new VolumeWrapper(volume);
      let dataVolumeWrapper;

      if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
        if (convertTemplateDataVolumesToAttachClonedDisk) {
          return {
            type: ProvisionSource.DISK,
            source: `${getNamespace(vmLikeEntity)}/${volumeWrapper.getDataVolumeName()}`,
          };
        }
        let dataVolume;

        if (dataVolumeLookup) {
          dataVolume = dataVolumeLookup[getVolumeDataVolumeName(volume)];
        }
        if (!dataVolume) {
          const allDataVolumes = [...getDataVolumeTemplates(vm)];
          if (dataVolumes) {
            allDataVolumes.push(...dataVolumes);
          }
          dataVolume = allDataVolumes.find((dv) => getName(dv) === getVolumeDataVolumeName(volume));
        }
        if (!dataVolume) {
          return {
            error: `Datavolume ${volumeWrapper.getDataVolumeName()} does not exist.`,
          };
        }
        dataVolumeWrapper = new DataVolumeWrapper(dataVolume);
      }

      const type = StorageUISource.fromTypes(
        volumeWrapper.getType(),
        dataVolumeWrapper && dataVolumeWrapper.getType(),
      );

      switch (type) {
        case StorageUISource.CONTAINER:
          return {
            type: ProvisionSource.CONTAINER,
            source: volumeWrapper.getContainerImage(),
          };
        case StorageUISource.URL:
          return {
            type: ProvisionSource.URL,
            source: dataVolumeWrapper.getURL(),
          };
        case StorageUISource.ATTACH_CLONED_DISK:
          return {
            type: ProvisionSource.DISK,
            source: `${dataVolumeWrapper.getPesistentVolumeClaimNamespace()}/${dataVolumeWrapper.getPesistentVolumeClaimName()}`,
          };
        case StorageUISource.ATTACH_DISK:
          return {
            type: ProvisionSource.DISK,
            source: `${getNamespace(vmLikeEntity)}/${volumeWrapper.getPersistentVolumeClaimName()}`,
          };
        case StorageUISource.BLANK:
          return {
            error: `Datavolume ${volumeWrapper.getDataVolumeName()} does not have a supported source (${type}).`,
          };
        default:
          return {
            error: `Volume ${volumeWrapper.getName()} does not have a supported source.`,
          };
      }
    }

    return {
      error: 'No bootable device found.',
    };
  };
}
