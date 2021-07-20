import * as React from 'react';
import { sortable } from '@patternfly/react-table';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { Flatten, MultiListPage, RowFunction, Table } from '@console/internal/components/factory';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { FieldLevelHelp, FirehoseResult } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, TemplateModel } from '@console/internal/models';
import {
  K8sResourceKind,
  PersistentVolumeClaimKind,
  TemplateKind,
} from '@console/internal/module/k8s';
import { CombinedDiskFactory } from '../../k8s/wrapper/vm/combined-disk';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { DataVolumeModel, VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getNamespace } from '../../selectors';
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
import { dimensifyHeader, getResource } from '../../utils';
import { wrapWithProgress } from '../../utils/utils';
import { diskModalEnhanced } from '../modals/disk-modal/disk-modal-enhanced';
import { VMTabProps } from '../vms/types';
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
            <FieldLevelHelp>
              {t(
                'kubevirt-plugin~The following information is provided by the OpenShift Virtualization operator.',
              )}
            </FieldLevelHelp>
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

type VMDisksProps = VMTabProps & {
  vmi?: VMIKind;
  isCommonTemplate?: boolean;
};

export const VMDisks: React.FC<VMDisksProps> = ({ obj: vmLikeEntity, vmi, isCommonTemplate }) => {
  const vmTemplateQuery = getVMTemplateNamespacedName(vmLikeEntity);
  const [vmTemplate] = useK8sWatchResource<TemplateKind>({
    kind: TemplateModel.kind,
    name: vmTemplateQuery?.name,
    namespace: vmTemplateQuery?.namespace,
    isList: false,
  });
  const { t } = useTranslation();
  const namespace = getNamespace(vmLikeEntity);
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  const templateValidations = getTemplateValidationsFromTemplate(vmTemplate);
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
    {
      kind: kubevirtReferenceForModel(DataVolumeModel),
      namespace,
      prop: 'datavolumes',
      optional: true,
    },
  ];

  const flatten: Flatten<{
    datavolumes: V1alpha1DataVolume[];
    pvcs: PersistentVolumeClaimKind[];
  }> = ({ datavolumes, pvcs }) =>
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

export const VMDisksAndFileSystemsPage: React.FC<VMTabProps> = (props) => {
  const {
    obj: vmLikeEntity,
    vm: vmProp,
    vmis: vmisProp,
    vmImports,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    customData: { kindObj },
  } = props;
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
    <>
      <VMDisks {...props} vmi={vmi} />
      <FileSystemsList vmi={vmi} vmStatusBundle={vmStatusBundle} />
    </>
  );
};
