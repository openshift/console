/* eslint-disable lines-between-class-members */
import { getName, getNamespace, K8sEntityMap } from '@console/shared/src';
import { ObjectEnum } from '@console/shared/src/constants/object-enum';
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
import { DataVolumeSourceType, VolumeType } from './storage';
import { SelectDropdownObjectEnum } from '../select-dropdown-object-enum';

type ProvisionSourceDetails = {
  type?: ProvisionSource;
  source?: string;
  error?: string;
};

export class ProvisionSource extends SelectDropdownObjectEnum<string> {
  static readonly UPLOAD = ProvisionSource.fromDataVolume(DataVolumeSourceType.UPLOAD, 1);
  static readonly URL = ProvisionSource.fromDataVolume(DataVolumeSourceType.HTTP, 2);
  static readonly DISK = ProvisionSource.fromDataVolume(DataVolumeSourceType.PVC, 3);
  static readonly CONTAINER = ProvisionSource.fromDataVolume(DataVolumeSourceType.REGISTRY, 4);
  static readonly CONTAINER_EPHEMERAL = new ProvisionSource('CONTAINER-EPHEMERAL', {
    // t('kubevirt-plugin~Container (ephemeral)')
    labelKey: 'kubevirt-plugin~Container (ephemeral)',
    order: 5,
  });
  static readonly PXE = new ProvisionSource('PXE', {
    // t('kubevirt-plugin~PXE (network boot - adds network interface)')
    labelKey: 'kubevirt-plugin~PXE (network boot - adds network interface)',
    // t('kubevirt-plugin~Boot an operating system from a server on a network. Requires a PXE bootable network attachment definition')
    descriptionKey:
      'kubevirt-plugin~Boot an operating system from a server on a network. Requires a PXE bootable network attachment definition',
    order: 6,
  });

  private static fromDataVolume(dvType: DataVolumeSourceType, order: number) {
    return new ProvisionSource(dvType.getValue(), {
      descriptionKey: dvType.getDescriptionKey(),
      labelKey: dvType.toString(),
      order,
    });
  }

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

  static getAdvancedWizardSources = () => [
    ProvisionSource.URL,
    ProvisionSource.DISK,
    ProvisionSource.CONTAINER,
    ProvisionSource.PXE,
  ];

  static getBasicWizardSources = () => [
    ProvisionSource.DISK,
    ProvisionSource.URL,
    ProvisionSource.CONTAINER,
  ];

  static getVMTemplateBaseImageSources = () => [
    ProvisionSource.UPLOAD,
    ProvisionSource.DISK,
    ProvisionSource.URL,
    ProvisionSource.CONTAINER,
  ];

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
            source: dataVolumeWrapper.getContainer(),
          };
        case StorageUISource.CONTAINER_EPHEMERAL:
          return {
            type: ProvisionSource.CONTAINER_EPHEMERAL,
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
            source: `${dataVolumeWrapper.getPersistentVolumeClaimNamespace()}/${dataVolumeWrapper.getPersistentVolumeClaimName()}`,
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
