import * as React from 'react';
import { RowFunction, Table, MultiListPage } from '@console/internal/components/factory';
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
import { StorageBundle } from './types';
import { DiskRow } from './disk-row';
import { diskTableColumnClasses } from './utils';
import { isVMI } from '../../selectors/check-type';
import { ADD_DISK } from '../../utils/strings';
import {
  getVMTemplateNamespacedName,
  getTemplateValidationsFromTemplate,
} from '../../selectors/vm-template/selectors';
import { diskSourceFilter } from './table-filters';

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

  return combinedDiskFactory.getCombinedDisks().map((disk) => ({
    disk,
    // for sorting
    name: disk.getName(),
    source: disk.getSourceValue(),
    diskInterface: disk.getDiskInterface(),
    size: disk.getReadableSize(),
    storageClass: disk.getStorageClassName(),
    metadata: { name: disk.getName(), type: disk.getType() },
  }));
};

export type VMDisksTableProps = {
  data?: any[];
  customData?: object;
  Row: RowFunction;
  loaded: boolean;
};

const NoDataEmptyMsg = () => <EmptyBox label="Disks" />;

const HeaderFacroty = (columnClasses: string[]) => () =>
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
  );

export const VMDisksTable: React.FC<React.ComponentProps<typeof Table> | VMDisksTableProps> = (
  props,
) => {
  return (
    <Table
      {...props}
      aria-label="VM Disks List"
      NoDataEmptyMsg={NoDataEmptyMsg}
      Header={HeaderFacroty(props?.customData?.columnClasses)}
      Row={props.Row || DiskRow}
      virtualize
    />
  );
};

type VMDisksProps = {
  vmLikeEntity?: VMGenericLikeEntityKind;
  pvcs?: FirehoseResult<K8sResourceKind[]>;
  datavolumes?: FirehoseResult<V1alpha1DataVolume[]>;
  vmTemplate?: FirehoseResult<TemplateKind>;
};

export const VMDisks: React.FC<VMDisksProps> = ({ vmLikeEntity, vmTemplate }) => {
  const namespace = getNamespace(vmLikeEntity);
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const templateValidations = getTemplateValidationsFromTemplate(getLoadedData(vmTemplate));

  const resources = [
    getResource(PersistentVolumeClaimModel, {
      namespace,
      prop: 'pvcs',
      optional: true,
    }),
    getResource(DataVolumeModel, {
      namespace,
      prop: 'datavolumes',
      optional: true,
    }),
  ];

  const flatten = ({ datavolumes, pvcs }) =>
    getStoragesData({
      vmLikeEntity,
      datavolumes: getLoadedData(datavolumes),
      pvcs: getLoadedData(pvcs),
    });

  const createFn = () =>
    withProgress(
      diskModalEnhanced({
        blocking: true,
        vmLikeEntity: !isVMI(vmLikeEntity) && vmLikeEntity,
        templateValidations,
      }).result,
    );

  return (
    <MultiListPage
      ListComponent={VMDisksTable}
      resources={resources}
      flatten={flatten}
      createButtonText={ADD_DISK}
      canCreate={!isVMI(vmLikeEntity)}
      createProps={{
        isDisabled: isLocked,
        onClick: createFn,
      }}
      rowFilters={[diskSourceFilter]}
      customData={{
        vmLikeEntity,
        withProgress,
        isDisabled: isLocked,
        templateValidations,
        columnClasses: diskTableColumnClasses,
      }}
      hideLabelFilter
    />
  );
};

export const VMDisksFirehose: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
  const vmTemplate = getVMTemplateNamespacedName(vmLikeEntity);

  const resources = [
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
