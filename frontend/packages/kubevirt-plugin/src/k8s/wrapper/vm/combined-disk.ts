import * as _ from 'lodash';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { apiVersionForModel } from '@console/internal/module/k8s/k8s';
import { createBasicLookup, getName, getNamespace, getOwnerReferences } from '@console/shared/src';
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
import { DataVolumeModel } from '../../../models';
import { compareOwnerReference } from '@console/shared/src/utils/owner-references';

export class CombinedDisk {
  private readonly dataVolumesLoading: boolean;

  private readonly pvcsLoading: boolean;

  private readonly source: StorageUISource;

  readonly id: string;

  readonly diskWrapper: DiskWrapper;

  readonly volumeWrapper: VolumeWrapper;

  readonly dataVolumeWrapper?: DataVolumeWrapper;

  readonly persistentVolumeClaimWrapper?: PersistentVolumeClaimWrapper;

  constructor({
    id,
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
    id?: string;
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
    this.id = id;
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

  getPVCNameBySource = (source?: StorageUISource) => {
    if (source === StorageUISource.IMPORT_DISK) {
      return this.persistentVolumeClaimWrapper?.getName();
    }
    if (source === StorageUISource.ATTACH_DISK) {
      return this.volumeWrapper?.getPersistentVolumeClaimName();
    }
    if (source === StorageUISource.ATTACH_CLONED_DISK) {
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
        return this.getPVCNameBySource(this.source);
      }
      case StorageUISource.ATTACH_DISK: {
        return this.getPVCNameBySource(this.source);
      }
      case StorageUISource.ATTACH_CLONED_DISK: {
        return this.getPVCNameBySource(this.source);
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

  private readonly dataVolumeTemplates: V1alpha1DataVolume[];

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
      dataVolumeTemplates: getDataVolumeTemplates(asVM(vmLikeEntity)),
      dataVolumes: getLoadedData(datavolumes, []),
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
    dataVolumeTemplates,
    dataVolumesLoading,
    pvcs,
    pvcsLoading,
    namespace,
  }: {
    disks: V1Disk[];
    volumes: V1Volume[];
    dataVolumeTemplates?: V1alpha1DataVolume[];
    dataVolumes?: V1alpha1DataVolume[];
    dataVolumesLoading?: boolean;
    pvcs?: K8sResourceKind[];
    pvcsLoading?: boolean;
    namespace: string;
  }) {
    this.disks = disks;
    this.volumes = volumes;
    this.dataVolumeTemplates = dataVolumeTemplates;
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
    const datavolumeTemplateLookup = createBasicLookup(this.dataVolumeTemplates, getName);
    const datavolumeLookup = createBasicLookup(this.dataVolumes, getName);
    const pvcLookup = createBasicLookup(this.pvcs, getName);

    return this.disks.map((disk) => {
      const diskWrapper = new DiskWrapper(disk);
      const volume = volumeLookup[diskWrapper.getName()];
      const volumeWrapper = new VolumeWrapper(volume);
      let dataVolumeName: string;
      let dataVolume;
      let dataVolumeTemplate;
      let pvc;

      switch (volumeWrapper.getType()) {
        case VolumeType.DATA_VOLUME:
          dataVolumeName = volumeWrapper.getDataVolumeName();
          dataVolumeTemplate = datavolumeTemplateLookup[dataVolumeName];
          dataVolume = datavolumeLookup[dataVolumeName];
          if (!dataVolume) {
            dataVolume = dataVolumeTemplate;
          }

          if (dataVolume && this.pvcs) {
            pvc = this.pvcs.find((p) =>
              (getOwnerReferences(p) || []).some((ownerReference) =>
                compareOwnerReference(ownerReference, {
                  name: dataVolumeName,
                  kind: DataVolumeModel.kind,
                  apiVersion: apiVersionForModel(DataVolumeModel),
                } as any),
              ),
            );
          }
          break;
        case VolumeType.PERSISTENT_VOLUME_CLAIM:
          pvc = pvcLookup[volumeWrapper.getPersistentVolumeClaimName()];
          break;
        default:
          break;
      }

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
    new Set(
      [...this.dataVolumeTemplates, ...this.dataVolumes]
        .map((dv) => getName(dv))
        .filter((n) => n && n !== excludeName),
    );
}
