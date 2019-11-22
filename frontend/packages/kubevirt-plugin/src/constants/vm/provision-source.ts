/* eslint-disable lines-between-class-members */
import { getName, getNamespace } from '@console/shared/src';
import { ValueEnum } from '../value-enum';
import {
  asVM,
  getDataVolumeTemplates,
  getDisks,
  getInterfaces,
  getVolumeDataVolumeName,
  getVolumes,
} from '../../selectors/vm';
import { VMLikeEntityKind } from '../../types';
import { StorageUISource } from '../../components/modals/disk-modal/storage-ui-source';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { VolumeType } from './storage';

type ProvisionSourceDetails = {
  type?: ProvisionSource;
  source?: string;
  error?: string;
};

export class ProvisionSource extends ValueEnum<string> {
  static readonly PXE = new ProvisionSource('PXE');
  static readonly CONTAINER = new ProvisionSource('Container');
  static readonly URL = new ProvisionSource('URL');
  static readonly IMPORT = new ProvisionSource('Import');
  static readonly DISK = new ProvisionSource('Disk');

  private static readonly ALL = Object.freeze(
    ValueEnum.getAllClassEnumProperties<ProvisionSource>(ProvisionSource),
  );

  private static readonly stringMapper = ProvisionSource.ALL.reduce(
    (accumulator, provisionSource: ProvisionSource) => ({
      ...accumulator,
      [provisionSource.value]: provisionSource,
    }),
    {},
  );

  static getAll = () => ProvisionSource.ALL;

  static fromSerialized = (provisionSource: { value: string }): ProvisionSource =>
    ProvisionSource.fromString(provisionSource && provisionSource.value);

  static fromString = (source: string): ProvisionSource => ProvisionSource.stringMapper[source];

  static getProvisionSourceDetails = (vmLikeEntity: VMLikeEntityKind): ProvisionSourceDetails => {
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
      const volumeWrapper = VolumeWrapper.initialize(volume);
      let dataVolumeWrapper;

      if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
        const dataVolume = getDataVolumeTemplates(vm).find(
          (dv) => getName(dv) === getVolumeDataVolumeName(volume),
        );
        if (!dataVolume) {
          return {
            error: `Datavolume ${volumeWrapper.getDataVolumeName()} does not exist.`,
          };
        }
        dataVolumeWrapper = DataVolumeWrapper.initialize(dataVolume);
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
