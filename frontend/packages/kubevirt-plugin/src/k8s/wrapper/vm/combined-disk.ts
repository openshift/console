import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { createBasicLookup, getName, getNamespace } from '@console/shared/src';
import { FirehoseResult } from '@console/internal/components/utils';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { getSimpleName } from '../../../selectors/utils';
import { VolumeType, DiskType, AccessMode, VolumeMode } from '../../../constants/vm/storage';
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
import { V1PersistentVolumeClaim } from '../../../types/vm/disk/V1PersistentVolumeClaim';

export class CombinedDisk {
  private readonly dataVolumesLoading: boolean;

  private readonly pvcsLoading: boolean;

  private readonly source: StorageUISource;

  readonly diskWrapper: DiskWrapper;

  readonly volumeWrapper: VolumeWrapper;

  readonly dataVolumeWrapper?: DataVolumeWrapper;

  readonly persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;

  constructor({
    disk,
    volume,
    dataVolume,
    persistentVolumeClaim,
    diskWrapper,
    volumeWrapper,
    dataVolumeWrapper,
    persistentVolumeClaimWrapper,
    isNewPVC,
    dataVolumesLoading,
    pvcsLoading,
  }: {
    disk?: V1Disk;
    volume?: V1Volume;
    dataVolume?: V1alpha1DataVolume;
    persistentVolumeClaim?: V1PersistentVolumeClaim;
    diskWrapper?: DiskWrapper;
    volumeWrapper?: VolumeWrapper;
    dataVolumeWrapper?: DataVolumeWrapper;
    persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;
    dataVolumesLoading?: boolean;
    pvcsLoading?: boolean;
    isNewPVC?: boolean;
  }) {
    this.diskWrapper = disk ? new DiskWrapper(disk) : diskWrapper;
    this.volumeWrapper = volume ? new VolumeWrapper(volume) : volumeWrapper;
    this.dataVolumeWrapper = dataVolume ? new DataVolumeWrapper(dataVolume) : dataVolumeWrapper;
    this.persistentVolumeClaimWrapper = persistentVolumeClaim
      ? new PersistentVolumeClaimWrapper(persistentVolumeClaim)
      : persistentVolumeClaimWrapper;
    this.dataVolumesLoading = dataVolumesLoading;
    this.pvcsLoading = pvcsLoading;

    this.source = StorageUISource.fromTypes(
      this.volumeWrapper?.getType(),
      this.dataVolumeWrapper?.getType(),
      !!this.persistentVolumeClaimWrapper && isNewPVC,
    );
  }

  getSource = () => this.source;

  getInitialSource = (isEditing) => {
    if (isEditing) {
      return this.source;
    }
    return this.diskWrapper?.getType() === DiskType.CDROM
      ? StorageUISource.URL
      : StorageUISource.BLANK;
  };

  getSourceValue = () => this.source.getValue();

  isEditingSupported = () => {
    switch (this.volumeWrapper.getType()) {
      case VolumeType.DATA_VOLUME:
        // do not edit already created entities
        return !(
          this.dataVolumeWrapper?.getCreationTimestamp() ||
          this.persistentVolumeClaimWrapper?.getCreationTimestamp()
        );
      default:
        return true;
    }
  };

  getName = () => this.diskWrapper?.getName();

  getType = () => this.diskWrapper?.getType();

  getTypeValue = () => this.diskWrapper?.getTypeValue();

  getDiskInterface = () => this.diskWrapper?.getReadableDiskBus();

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

  getAccessModes = (): AccessMode[] =>
    this.volumeTypeOperation(
      (persistentVolumeClaimWrapper) => persistentVolumeClaimWrapper.getAccessModesEnum(),
      (dataVolumeWrapper) => dataVolumeWrapper.getAccessModesEnum(),
    );

  getVolumeMode = (): VolumeMode =>
    this.volumeTypeOperation(
      (persistentVolumeClaimWrapper) => persistentVolumeClaimWrapper.getVolumeModeEnum(),
      (dataVolumeWrapper) => dataVolumeWrapper.getVolumeModeEnum(),
    );

  getPVCName = (source?: StorageUISource) => {
    const resolvedSource = source || this.source;
    if (resolvedSource === StorageUISource.IMPORT_DISK) {
      return this.persistentVolumeClaimWrapper?.getName();
    }
    if (resolvedSource === StorageUISource.ATTACH_DISK) {
      return this.volumeWrapper?.getPersistentVolumeClaimName();
    }
    if (resolvedSource === StorageUISource.ATTACH_CLONED_DISK) {
      return this.dataVolumeWrapper?.getPesistentVolumeClaimName();
    }

    return null;
  };

  getContent = () => {
    switch (this.source) {
      case StorageUISource.CONTAINER: {
        return this.volumeWrapper?.getContainerImage();
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
    isWinToolsImage(this.volumeWrapper?.getContainerImage())
      ? 'Windows Tools'
      : this.getSourceValue();

  toString = () => {
    return _.compact([
      this.getName(),
      this.getReadableSize(),
      this.getDiskInterface(),
      this.getStorageClassName(),
      this.getVolumeMode(),
      (this.getAccessModes() || []).length > 0 ? this.getAccessModes().join(', ') : null,
    ]).join(' - ');
  };

  private volumeTypeOperation = (
    onPersistentVolumeClaimWrapper: (
      persistentVolumeClaimWrapper: PersistentVolumeClaimWrapper,
    ) => any,
    onDataVolumeWrapper: (dataVolumeWrapper: DataVolumeWrapper) => any,
  ) => {
    const volumeType = this.volumeWrapper?.getType();
    if (volumeType === VolumeType.PERSISTENT_VOLUME_CLAIM) {
      if (this.persistentVolumeClaimWrapper) {
        return onPersistentVolumeClaimWrapper(this.persistentVolumeClaimWrapper) || null;
      }
      if (this.pvcsLoading) {
        return undefined;
      }
    } else if (volumeType === VolumeType.DATA_VOLUME) {
      if (this.dataVolumeWrapper) {
        return onDataVolumeWrapper(this.dataVolumeWrapper) || null;
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
        ...getDataVolumeTemplates(asVM(vmLikeEntity)),
        ...getLoadedData(datavolumes, []),
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
      const diskWrapper = new DiskWrapper(disk);
      const volume = volumeLookup[diskWrapper.getName()];
      const volumeWrapper = new VolumeWrapper(volume);
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
        dataVolumeWrapper: dataVolume && new DataVolumeWrapper(dataVolume),
        persistentVolumeClaimWrapper: pvc && new PersistentVolumeClaimWrapper(pvc),
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
