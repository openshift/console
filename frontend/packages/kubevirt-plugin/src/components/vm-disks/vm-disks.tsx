import { TFunction } from 'i18next';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

import { MultiListPage, RowFunction, Table } from '@console/internal/components/factory';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import { K8sResourceKind, TemplateKind } from '@console/internal/module/k8s';
import { dimensifyHeader, getNamespace } from '@console/shared';
import { Button, Popover } from '@patternfly/react-core';
import { QuestionCircleIcon } from '@patternfly/react-icons';
import { sortable } from '@patternfly/react-table';

import { CombinedDiskFactory } from '../../k8s/wrapper/vm/combined-disk';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { DataVolumeModel, VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { isVM, isVMI } from '../../selectors/check-type';
import { asVM } from '../../selectors/vm';
import { changedDisks } from '../../selectors/vm-like/next-run-changes';
import {
  getTemplateValidationsFromTemplate,
  getVMTemplateNamespacedName,
} from '../../selectors/vm-template/selectors';
import { isVMRunningOrExpectedRunning } from '../../selectors/vm/selectors';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMIKind } from '../../types';
import { V1alpha1DataVolume } from '../../types/api';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { getLoadedData, getResource } from '../../utils';
import { wrapWithProgress } from '../../utils/utils';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { VMLikeEntityTabProps, VMTabProps } from '../vms/types';
import { DiskRow } from './disk-row';
import { FileSystemsList } from './guest-agent-file-systems';
import { diskSourceFilter } from './table-filters';
import { StorageBundle } from './types';
import { diskTableColumnClasses } from './utils';

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

const getHeader = (t: TFunction, columnClasses: string[]) => () =>
  dimensifyHeader(
    [
      {
        title: t('kubevirt-plugin~Name'),
        sortField: 'name',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Source'),
        sortField: 'source',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Size'),
        sortField: 'size',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Drive'),
        sortField: 'type',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Interface'),
        sortField: 'diskInterface',
        transforms: [sortable],
      },
      {
        title: t('kubevirt-plugin~Storage Class'),
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
  const { t } = useTranslation();
  return (
    <div>
      {props?.customData?.showGuestAgentHelp && (
        <>
          <h3>
            {t('kubevirt-plugin~Disks')}
            <Popover
              aria-label={t('kubevirt-plugin~Disks description')}
              position="top"
              bodyContent={
                <>
                  {t(
                    'kubevirt-plugin~The following information is provided by the OpenShift Virtualization operator.',
                  )}
                </>
              }
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
        aria-label={t('kubevirt-plugin~VM Disks List')}
        label={t('kubevirt-plugin~Disks')}
        Header={getHeader(t, props?.customData?.columnClasses)}
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
  vmi?: VMIKind;
  isCommonTemplate?: boolean;
};

export const VMDisks: React.FC<VMDisksProps> = ({
  vmLikeEntity,
  vmTemplate,
  vmi,
  isCommonTemplate,
}) => {
  const { t } = useTranslation();
  const namespace = getNamespace(vmLikeEntity);
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const templateValidations = getTemplateValidationsFromTemplate(getLoadedData(vmTemplate));
  const isVMRunning = isVM(vmLikeEntity) && isVMRunningOrExpectedRunning(asVM(vmLikeEntity), vmi);
  const pendingChangesDisks: Set<string> =
    isVMRunning && vmi
      ? new Set(changedDisks(new VMWrapper(asVM(vmLikeEntity)), new VMIWrapper(vmi)))
      : null;

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
      createButtonText={t('kubevirt-plugin~Add Disk')}
      canCreate={!isVMI(vmLikeEntity)}
      createProps={{
        isDisabled: isLocked || isCommonTemplate,
        onClick: createFn,
        id: 'add-disk',
      }}
      rowFilters={[diskSourceFilter]}
      customData={{
        vmLikeEntity,
        vmi,
        withProgress,
        isDisabled: isLocked || isCommonTemplate,
        templateValidations,
        columnClasses: diskTableColumnClasses,
        showGuestAgentHelp: true,
        pendingChangesDisks,
      }}
      hideLabelFilter
    />
  );
};

export const VMDisksFirehose: React.FC<VMLikeEntityTabProps> = ({
  obj: vmLikeEntity,
  customData: { isCommonTemplate },
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

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} isCommonTemplate={isCommonTemplate} />
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
  pvcs,
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
    pvcs,
    dataVolumes,
    vmImports,
  });

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} vmi={vmi} />
      <FileSystemsList vmi={vmi} vmStatusBundle={vmStatusBundle} />
    </Firehose>
  );
};
