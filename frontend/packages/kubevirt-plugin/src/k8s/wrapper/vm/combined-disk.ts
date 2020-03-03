import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createBasicLookup, getName, getNamespace } from '@console/shared/src';
import { FirehoseResult } from '@console/internal/components/utils';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { getSimpleName } from '../../../selectors/utils';
import { VolumeType, DiskType } from '../../../constants/vm/storage';
import { VMGenericLikeEntityKind } from '../../../types/vmLike';
import { asVM, getDataVolumeTemplates, isWinToolsImage } from '../../../selectors/vm';
import { getLoadedData, isLoaded } from '../../../utils';
import { StorageUISource } from '../../../components/modals/disk-modal/storage-ui-source';
import { DYNAMIC } from '../../../utils/strings';
import { DiskWrapper } from './disk-wrapper';
import { DataVolumeWrapper } from './data-volume-wrapper';
import { VolumeWrapper } from './volume-wrapper';
import { PersistentVolumeClaimWrapper } from './persistent-volume-claim-wrapper';
import { asVMILikeWrapper } from '../utils/convert';

export class CombinedDisk {
  private readonly dataVolumesLoading: boolean;

  private readonly pvcsLoading: boolean;

  private readonly source: StorageUISource;

  readonly diskWrapper: DiskWrapper;

  readonly volumeWrapper: VolumeWrapper;

  readonly dataVolumeWrapper?: DataVolumeWrapper;

  readonly persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;

  constructor({
    diskWrapper,
    volumeWrapper,
    dataVolumeWrapper,
    persistentVolumeClaimWrapper,
    isNewPVC,
    dataVolumesLoading,
    pvcsLoading,
  }: {
    diskWrapper: DiskWrapper;
    volumeWrapper: VolumeWrapper;
    dataVolumeWrapper?: DataVolumeWrapper;
    persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;
    dataVolumesLoading?: boolean;
    pvcsLoading?: boolean;
    isNewPVC?: boolean;
  }) {
    this.diskWrapper = diskWrapper;
    this.volumeWrapper = volumeWrapper;
    this.dataVolumeWrapper = dataVolumeWrapper;
    this.persistentVolumeClaimWrapper = persistentVolumeClaimWrapper;
    this.dataVolumesLoading = dataVolumesLoading;
    this.pvcsLoading = pvcsLoading;
    this.source = StorageUISource.fromTypes(
      volumeWrapper.getType(),
      dataVolumeWrapper && dataVolumeWrapper.getType(),
      !!persistentVolumeClaimWrapper && isNewPVC,
    );
  }

  getSource = () => this.source;

  getInitialSource = (isEditing) => {
    if (isEditing) {
      return this.source;
    }
    return this.diskWrapper.getType() === DiskType.CDROM
      ? StorageUISource.URL
      : StorageUISource.BLANK;
  };

  getSourceValue = () => this.source.getValue();

  isEditingSupported = (isTemplate: boolean) => {
    if (isTemplate) {
      // plain dataVolume creates dataVolumes on template creation
      return this.source.isPlainDataVolume(isTemplate) ? this.source.isEditingSupported() : true;
    }

    return this.source.isEditingSupported();
  };

  getName = () => this.diskWrapper.getName();

  getType = () => this.diskWrapper.getType();

  getTypeValue = () => this.diskWrapper.getTypeValue();

  getDiskInterface = () => this.diskWrapper.getReadableDiskBus();

  getReadableSize = (): string => {
    let result = this.volumeTypeOperation(
      (persistentVolumeClaimWrapper) => persistentVolumeClaimWrapper.getReadabableSize(),
      (dataVolumeWrapper) => dataVolumeWrapper.getReadabableSize(),
    );

    if (result === null && this.source.hasDynamicSize()) {
      result = DYNAMIC;
    }

    return result;
  };

  getSize = (): { value: number; unit: string } =>
    this.volumeTypeOperation(
      (persistentVolumeClaimWrapper) => persistentVolumeClaimWrapper.getSize(),
      (dataVolumeWrapper) => dataVolumeWrapper.getSize(),
    );

  getStorageClassName = () =>
    this.volumeTypeOperation(
      (persistentVolumeClaimWrapper) => persistentVolumeClaimWrapper.getStorageClassName(),
      (dataVolumeWrapper) => dataVolumeWrapper.getStorageClassName(),
    );

  getPVCName = (source?: StorageUISource) => {
    const resolvedSource = source || this.source;
    if (resolvedSource === StorageUISource.IMPORT_DISK) {
      return this.persistentVolumeClaimWrapper && this.persistentVolumeClaimWrapper.getName();
    }
    if (resolvedSource === StorageUISource.ATTACH_DISK) {
      return this.volumeWrapper && this.volumeWrapper.getPersistentVolumeClaimName();
    }
    if (resolvedSource === StorageUISource.ATTACH_CLONED_DISK) {
      return this.dataVolumeWrapper && this.dataVolumeWrapper.getPesistentVolumeClaimName();
    }

    return null;
  };

  getContent = () => {
    switch (this.source) {
      case StorageUISource.CONTAINER: {
        return this.volumeWrapper.getContainerImage();
      }
      case StorageUISource.URL: {
        return this.dataVolumeWrapper.getURL();
      }
      case StorageUISource.IMPORT_DISK: {
        return this.getPVCName(this.source);
      }
      case StorageUISource.ATTACH_DISK: {
        return this.getPVCName(this.source);
      }
      case StorageUISource.ATTACH_CLONED_DISK: {
        return this.getPVCName(this.source);
      }
      default:
        return null;
    }
  };

  getCDROMSourceValue = () =>
    isWinToolsImage(this.volumeWrapper.getContainerImage())
      ? 'Windows Tools'
      : this.getSourceValue();

  toString = () => {
    return _.compact([
      this.getName(),
      this.getReadableSize(),
      this.getDiskInterface(),
      this.getStorageClassName(),
    ]).join(' - ');
  };

  private volumeTypeOperation = (
    onPersistentVolumeClaimWrapper: (
      persistentVolumeClaimWrapper: PersistentVolumeClaimWrapper,
    ) => any,
    onDataVolumeWrapper: (dataVolumeWrapper: DataVolumeWrapper) => any,
  ) => {
    const volumeType = this.volumeWrapper.getType();
    if (volumeType === VolumeType.PERSISTENT_VOLUME_CLAIM) {
      if (this.persistentVolumeClaimWrapper) {
        return onPersistentVolumeClaimWrapper(this.persistentVolumeClaimWrapper);
      }
      if (this.pvcsLoading) {
        return undefined;
      }
    } else if (volumeType === VolumeType.DATA_VOLUME) {
      if (this.dataVolumeWrapper) {
        return onDataVolumeWrapper(this.dataVolumeWrapper);
      }
      if (this.dataVolumesLoading) {
        return undefined;
      }
    }
    return null;
  };
}

export class CombinedDiskFactory {
  private readonly disks: V1Disk[];

  private readonly volumes: V1Volume[];

  private readonly dataVolumes: V1alpha1DataVolume[];

  private readonly pvcs: K8sResourceKind[];

  private readonly dataVolumesLoading: boolean;

  private readonly pvcsLoading: boolean;

  static initializeFromVMLikeEntity = (
    vmLikeEntity: VMGenericLikeEntityKind,
    datavolumes?: FirehoseResult<V1alpha1DataVolume[]>,
    pvcs?: FirehoseResult,
  ) => {
    const vmiLikeWrapper = asVMILikeWrapper(vmLikeEntity);

    return new CombinedDiskFactory({
      disks: vmiLikeWrapper?.getDisks() || [],
      volumes: vmiLikeWrapper?.getVolumes() || [],
      dataVolumes: [
        ...getLoadedData(datavolumes, []),
        ...getDataVolumeTemplates(asVM(vmLikeEntity)),
      ],
      pvcs: getLoadedData(pvcs),
      dataVolumesLoading: !isLoaded(datavolumes),
      pvcsLoading: !isLoaded(pvcs),
      namespace: getNamespace(vmLikeEntity),
    });
  };

  constructor({
    disks,
    volumes,
    dataVolumes,
    dataVolumesLoading,
    pvcs,
    pvcsLoading,
    namespace,
  }: {
    disks: V1Disk[];
    volumes: V1Volume[];
    dataVolumes?: V1alpha1DataVolume[];
    dataVolumesLoading?: boolean;
    pvcs?: K8sResourceKind[];
    pvcsLoading?: boolean;
    namespace: string;
  }) {
    this.disks = disks;
    this.volumes = volumes;
    this.dataVolumes =
      dataVolumes &&
      dataVolumes.filter((dataVolume) => {
        const ns = getNamespace(dataVolume);
        return !ns || ns === namespace;
      });
    this.pvcs =
      pvcs &&
      pvcs.filter((pvc) => {
        const ns = getNamespace(pvc);
        return !ns || ns === namespace;
      });
    this.dataVolumesLoading = dataVolumesLoading;
    this.pvcsLoading = pvcsLoading;
  }

  getCombinedDisks = (): CombinedDisk[] => {
    const volumeLookup = createBasicLookup(this.volumes, getSimpleName);
    const datavolumeLookup = createBasicLookup(this.dataVolumes, getName);
    const pvcLookup = createBasicLookup(this.pvcs, getName);

    return this.disks.map((disk) => {
      const diskWrapper = DiskWrapper.initialize(disk);
      const volume = volumeLookup[diskWrapper.getName()];
      const volumeWrapper = VolumeWrapper.initialize(volume);
      const dataVolume =
        volumeWrapper.getType() === VolumeType.DATA_VOLUME
          ? datavolumeLookup[volumeWrapper.getDataVolumeName()]
          : undefined;
      const pvc =
        volumeWrapper.getType() === VolumeType.PERSISTENT_VOLUME_CLAIM
          ? pvcLookup[volumeWrapper.getPersistentVolumeClaimName()]
          : undefined;

      return new CombinedDisk({
        diskWrapper,
        volumeWrapper,
        dataVolumeWrapper: dataVolume && DataVolumeWrapper.initialize(dataVolume),
        persistentVolumeClaimWrapper: pvc && PersistentVolumeClaimWrapper.initialize(pvc),
        dataVolumesLoading: this.dataVolumesLoading,
        pvcsLoading: this.pvcsLoading,
      });
    });
  };

  getUsedDiskNames = (excludeName: string): Set<string> =>
    new Set(this.disks.map(getSimpleName).filter((n) => n && n !== excludeName));

  getUsedDataVolumeNames = (excludeName: string): Set<string> =>
    new Set(this.dataVolumes.map((dv) => getName(dv)).filter((n) => n && n !== excludeName));
}
