import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { sortable } from '@patternfly/react-table';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { RowFunction, Table, MultiListPage } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { Firehose, FirehoseResult, EmptyBox } from '@console/internal/components/utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { dimensifyHeader, getNamespace } from '@console/shared';
import { DataVolumeModel, VirtualMachineModel, VirtualMachineInstanceModel } from '../../models';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { getResource, getLoadedData } from '../../utils';
import { wrapWithProgress } from '../../utils/utils';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { CombinedDiskFactory } from '../../k8s/wrapper/vm/combined-disk';
import { V1alpha1DataVolume } from '../../types/vm/disk/V1alpha1DataVolume';
import { StorageBundle } from './types';
import { DiskRow } from './disk-row';
import { diskTableColumnClasses } from './utils';
import { isVMI, isVM } from '../../selectors/check-type';
import { ADD_DISK } from '../../utils/strings';
import {
  getVMTemplateNamespacedName,
  getTemplateValidationsFromTemplate,
} from '../../selectors/vm-template/selectors';
import { diskSourceFilter } from './table-filters';
import { VMLikeEntityTabProps, VMTabProps } from '../vms/types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { FileSystemsList } from './guest-agent-file-systems';
import { VM_DISKS_DESCRIPTION } from '../../strings/vm/messages';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { asVM } from '../../selectors/vm';

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
    metadata: { name: disk.getName() },
    type: disk.getType(),
  }));
};

export type VMDisksTableProps = {
  data?: any[];
  customData?: object;
  Row: RowFunction;
  loaded: boolean;
};

const NoDataEmptyMsg = () => <EmptyBox label="Disks" />;

const getHeader = (columnClasses: string[]) => () =>
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
        title: 'Drive',
        sortField: 'type',
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
    <div>
      {props?.customData?.showGuestAgentHelp && (
        <>
          <h3>
            Disks
            <Popover
              aria-label="Disks description"
              position="top"
              bodyContent={<>{VM_DISKS_DESCRIPTION}</>}
            >
              <Button variant="plain">
                <QuestionCircleIcon />
              </Button>
            </Popover>
          </h3>
        </>
      )}
      <Table
        {...props}
        aria-label="VM Disks List"
        NoDataEmptyMsg={NoDataEmptyMsg}
        Header={getHeader(props?.customData?.columnClasses)}
        Row={props.Row || DiskRow}
        virtualize
      />
    </div>
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
  const isVMRunning = isVM(vmLikeEntity) && isVMRunningOrExpectedRunning(asVM(vmLikeEntity));

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
      datavolumes,
      pvcs,
    });

  const createFn = () =>
    withProgress(
      diskModalEnhanced({
        blocking: true,
        vmLikeEntity: !isVMI(vmLikeEntity) && vmLikeEntity,
        templateValidations,
        isVMRunning,
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
        id: 'add-disk',
      }}
      rowFilters={[diskSourceFilter]}
      customData={{
        vmLikeEntity,
        withProgress,
        isDisabled: isLocked,
        templateValidations,
        columnClasses: diskTableColumnClasses,
        showGuestAgentHelp: true,
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

export const VMDisksAndFileSystemsPage: React.FC<VMTabProps> = ({
  obj: vmLikeEntity,
  vm: vmProp,
  vmis: vmisProp,
  vmImports,
  pods,
  migrations,
  dataVolumes,
  customData: { kindObj },
}) => {
  const vmTemplate = getVMTemplateNamespacedName(vmLikeEntity);

  const resources = [
    getResource(TemplateModel, {
      name: vmTemplate?.name,
      namespace: vmTemplate?.namespace,
      isList: false,
      prop: 'vmTemplate',
    }),
  ];

  const vm =
    kindObj === VirtualMachineModel && isVM(vmLikeEntity)
      ? vmLikeEntity
      : isVM(vmProp)
      ? vmProp
      : null;
  const vmi =
    kindObj === VirtualMachineInstanceModel && isVMI(vmLikeEntity)
      ? vmLikeEntity
      : isVMI(vmisProp[0])
      ? vmisProp[0]
      : null;

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  });

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} />
      <FileSystemsList vmi={vmi} vmStatusBundle={vmStatusBundle} />
    </Firehose>
  );
};
