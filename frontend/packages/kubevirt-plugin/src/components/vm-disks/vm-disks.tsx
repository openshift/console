import * as React from 'react';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { Table, RowFunction } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { Firehose, FirehoseResult, EmptyBox } from '@console/internal/components/utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { dimensifyHeader, getNamespace } from '@console/shared';
import { sortable } from '@patternfly/react-table';
import { DataVolumeModel } from '../../models';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { VMLikeEntityTabProps } from '../vms/types';
import { getResource, getLoadedData } from '../../utils';
import { wrapWithProgress } from '../../utils/utils';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { CombinedDiskFactory } from '../../k8s/wrapper/vm/combined-disk';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { VHW_TYPES } from '../create-vm-wizard/tabs/virtual-hardware-tab/types';
import { StorageBundle } from './types';
import { DiskRow } from './disk-row';
import { diskTableColumnClasses } from './utils';
import { isVMI } from '../../selectors/vm';
import { ADD_DISK } from '../../utils/strings';
import {
  getVMTemplateNamespacedName,
  getTemplateValidationsFromTemplate,
} from '../../selectors/vm-template/selectors';

const getStoragesData = ({
  vmLikeEntity,
  datavolumes,
  pvcs,
}: {
  vmLikeEntity: VMGenericLikeEntityKind;
  pvcs: FirehoseResult<K8sResourceKind[]>;
  datavolumes: FirehoseResult<V1alpha1DataVolume[]>;
}): StorageBundle[] => {
  const combinedDiskFactory = CombinedDiskFactory.initializeFromVMLikeEntity(
    vmLikeEntity,
    datavolumes,
    pvcs,
  );

  return combinedDiskFactory
    .getCombinedDisks()
    .filter((storage) => !VHW_TYPES.has(storage.diskWrapper.getType()))
    .map((disk) => ({
      disk,
      // for sorting
      name: disk.getName(),
      source: disk.getSourceValue(),
      diskInterface: disk.getDiskInterface(),
      size: disk.getReadableSize(),
      storageClass: disk.getStorageClassName(),
    }));
};

export type VMDisksTableProps = {
  data?: any[];
  customData?: object;
  row: RowFunction;
  columnClasses: string[];
};

const NoDataEmptyMsg = () => <EmptyBox label="Disks" />;

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
      NoDataEmptyMsg={NoDataEmptyMsg}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Name',
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: 'Source',
              sortField: 'source',
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
  vmLikeEntity?: VMGenericLikeEntityKind;
  pvcs?: FirehoseResult<K8sResourceKind[]>;
  datavolumes?: FirehoseResult<V1alpha1DataVolume[]>;
  vmTemplate?: FirehoseResult<TemplateKind>;
};

export const VMDisks: React.FC<VMDisksProps> = ({
  vmLikeEntity,
  pvcs,
  datavolumes,
  vmTemplate,
}) => {
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const templateValidations = getTemplateValidationsFromTemplate(getLoadedData(vmTemplate));

  return (
    <div className="co-m-list">
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant={ButtonVariant.primary}
              id="create-disk-btn"
              onClick={() =>
                withProgress(
                  diskModalEnhanced({
                    blocking: true,
                    vmLikeEntity,
                    templateValidations,
                  }).result,
                )
              }
              isDisabled={isLocked}
            >
              {ADD_DISK}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMDisksTable
          data={getStoragesData({ vmLikeEntity, pvcs, datavolumes })}
          customData={{
            vmLikeEntity,
            withProgress,
            isDisabled: isLocked,
            templateValidations,
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
  const vmTemplate = getVMTemplateNamespacedName(vmLikeEntity);

  const resources = [
    getResource(PersistentVolumeClaimModel, {
      namespace,
      prop: 'pvcs',
    }),
    getResource(DataVolumeModel, {
      namespace,
      prop: 'datavolumes',
    }),
    getResource(TemplateModel, {
      name: vmTemplate?.name,
      namespace: vmTemplate?.namespace,
      isList: false,
      prop: 'vmTemplate',
    }),
  ];

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} />
    </Firehose>
  );
};
