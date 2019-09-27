import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { Table } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { getNamespace, getName, createBasicLookup, createLookup } from '@console/shared';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { sortable } from '@patternfly/react-table';
import { DataVolumeModel } from '../../models';
import { VMLikeEntityKind } from '../../types';
import { asVM, getDataVolumeTemplates, getDisks, getVolumes, isVM } from '../../selectors/vm';
import { getPvcStorageClassName, getPvcStorageSize } from '../../selectors/pvc/selectors';
import {
  getDataVolumeStorageClassName,
  getDataVolumeStorageSize,
} from '../../selectors/dv/selectors';
import { VMLikeEntityTabProps } from '../vms/types';
import { getResource } from '../../utils';
import { getSimpleName } from '../../selectors/utils';
import { wrapWithProgress } from '../../utils/utils';
import { dimensifyHeader } from '../../utils/table';
import { DiskWrapper } from '../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../k8s/wrapper/vm/volume-wrapper';
import { DiskType, VolumeType } from '../../constants/vm/storage';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { StorageUISource } from '../modals/disk-modal/storage-ui-source';
import { DataVolumeWrapper } from '../../k8s/wrapper/vm/data-volume-wrapper';
import { StorageBundle } from './types';
import { DiskRow } from './disk-row';
import { diskTableColumnClasses } from './utils';

const getStoragesData = ({
  vmLikeEntity,
  datavolumes,
  pvcs,
}: {
  vmLikeEntity: VMLikeEntityKind;
  pvcs: FirehoseResult<K8sResourceKind[]>;
  datavolumes: FirehoseResult<K8sResourceKind[]>;
}): StorageBundle[] => {
  const vm = asVM(vmLikeEntity);

  const pvcLookup = createLookup(pvcs, getName);
  const datavolumeLookup = createLookup(datavolumes, getName);
  const volumeLookup = createBasicLookup(getVolumes(vm), getSimpleName);
  const datavolumeTemplatesLookup = createBasicLookup<any>(getDataVolumeTemplates(vm), getName);

  return getDisks(vm).map((disk) => {
    const diskWrapper = DiskWrapper.initialize(disk);
    const volume = volumeLookup[diskWrapper.getName()];
    const volumeWrapper = VolumeWrapper.initialize(volume);

    let size = null;
    let storageClass = null;

    if (volumeWrapper.getType() === VolumeType.PERSISTENT_VOLUME_CLAIM) {
      const pvc = pvcLookup[volumeWrapper.getPersistentVolumeClaimName()];
      if (pvc) {
        size = getPvcStorageSize(pvc);
        storageClass = getPvcStorageClassName(pvc);
      } else if (!pvcs.loaded) {
        size = undefined;
        storageClass = undefined;
      }
    } else if (volumeWrapper.getType() === VolumeType.DATA_VOLUME) {
      const dataVolumeTemplate =
        datavolumeTemplatesLookup[volumeWrapper.getDataVolumeName()] ||
        datavolumeLookup[volumeWrapper.getDataVolumeName()];

      if (dataVolumeTemplate) {
        size = getDataVolumeStorageSize(dataVolumeTemplate);
        storageClass = getDataVolumeStorageClassName(dataVolumeTemplate);
      } else if (!datavolumes.loaded) {
        size = undefined;
        storageClass = undefined;
      }
    }

    const dataVolume = datavolumeTemplatesLookup[volumeWrapper.getDataVolumeName()];
    const source = StorageUISource.fromTypes(
      volumeWrapper.getType(),
      DataVolumeWrapper.initialize(dataVolume).getType(),
    );
    const isTemplate = vmLikeEntity && !isVM(vmLikeEntity);
    return {
      disk,
      volume,
      dataVolume,
      isEditingEnabled: isTemplate || (source && source.isEditingSupported()),
      // for sorting
      name: diskWrapper.getName(),
      diskInterface:
        diskWrapper.getType() === DiskType.DISK ? diskWrapper.getReadableDiskBus() : undefined,
      size,
      storageClass,
    };
  });
};

export type VMDisksTableProps = {
  data?: any[];
  customData?: object;
  row: React.ComponentClass<any, any> | React.ComponentType<any>;
  columnClasses: string[];
};

export const VMDisksTable: React.FC<VMDisksTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  return (
    <Table
      aria-label="VM Disks List"
      data={data}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Name',
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: 'Size',
              sortField: 'size',
              transforms: [sortable],
            },
            {
              title: 'Interface',
              sortField: 'diskInterface',
              transforms: [sortable],
            },
            {
              title: 'Storage Class',
              sortField: 'storageClass',
              transforms: [sortable],
            },
            {
              title: '',
            },
          ],
          columnClasses,
        )
      }
      Row={Row}
      customData={{ ...customData, columnClasses }}
      virtualize
      loaded
    />
  );
};

type VMDisksProps = {
  vmLikeEntity?: VMLikeEntityKind;
  pvcs?: FirehoseResult<K8sResourceKind[]>;
  datavolumes?: FirehoseResult<K8sResourceKind[]>;
};

export const VMDisks: React.FC<VMDisksProps> = ({ vmLikeEntity, pvcs, datavolumes }) => {
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  return (
    <div className="co-m-list">
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Button
            variant={ButtonVariant.primary}
            id="create-disk-btn"
            onClick={() =>
              withProgress(
                diskModalEnhanced({
                  vmLikeEntity,
                }).result,
              )
            }
            isDisabled={isLocked}
          >
            Create Disk
          </Button>
        </div>
      </div>
      <div className="co-m-pane__body">
        <VMDisksTable
          data={getStoragesData({ vmLikeEntity, pvcs, datavolumes })}
          customData={{
            vmLikeEntity,
            withProgress,
            isDisabled: isLocked,
          }}
          row={DiskRow}
          columnClasses={diskTableColumnClasses}
        />
      </div>
    </div>
  );
};

export const VMDisksFirehose: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
  const namespace = getNamespace(vmLikeEntity);

  const resources = [
    getResource(PersistentVolumeClaimModel, {
      namespace,
      prop: 'pvcs',
    }),
    getResource(DataVolumeModel, {
      namespace,
      prop: 'datavolumes',
    }),
  ];

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} />
    </Firehose>
  );
};
