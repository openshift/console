import * as React from 'react';
import { TableData, TableRow, RowFunction } from '@console/internal/components/factory';
import {
  asAccessReview,
  Kebab,
  KebabOption,
  ResourceLink,
  Timestamp,
} from '@console/internal/components/utils';
import { deleteModal } from '@console/internal/components/modals';
import {
  getName,
  getNamespace,
  dimensifyRow,
  getCreationTimestamp,
  Status,
  ErrorStatus,
} from '@console/shared';
import { referenceFor } from '@console/internal/module/k8s';
import { VirtualMachineSnapshotModel } from '../../models';
import { isVMI } from '../../selectors/check-type';
import { VMLikeEntityKind } from '../../types/vmLike';
import { VMSnapshotRowActionOpts, VMSnapshotRowCustomData } from './types';
import { VMSnapshot } from '../../types';
import { getVMSnapshotError, isVMSnapshotReady } from '../../selectors/snapshot/snapshot';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';
import { asVM, isVMRunningOrExpectedRunning } from '../../selectors/vm';

const menuActionRestore = (
  snapshot: VMSnapshot,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: { withProgress: (promise: Promise<any>) => void },
): KebabOption => ({
  label: 'Restore',
  isDisabled: isVMRunningOrExpectedRunning(asVM(vmLikeEntity)),
  callback: () =>
    withProgress(
      snapshotRestoreModal({
        snapshot,
      }).result,
    ),
});

const menuActionDelete = (
  snapshot: VMSnapshot,
  vmLikeEntity: VMLikeEntityKind,
  { withProgress }: { withProgress: (promise: Promise<any>) => void },
): KebabOption => ({
  label: 'Delete',
  callback: () =>
    withProgress(
      deleteModal({
        kind: VirtualMachineSnapshotModel,
        resource: snapshot,
      }),
    ),
  accessReview: asAccessReview(VirtualMachineSnapshotModel, snapshot, 'delete'),
});

const getActions = (
  snapshot: VMSnapshot,
  vmLikeEntity: VMLikeEntityKind,
  opts: VMSnapshotRowActionOpts,
) => {
  if (isVMI(vmLikeEntity)) {
    return [];
  }

  const actions = [menuActionRestore, menuActionDelete];
  return actions.map((a) => a(snapshot, vmLikeEntity, opts));
};

export type VMSnapshotSimpleRowProps = {
  data: VMSnapshot;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
};

export type VMSnapshotStatusProps = {
  error: any;
  readyToUse: boolean;
};

export const VMSnapshotStatus: React.FC<VMSnapshotStatusProps> = ({ error, readyToUse }) =>
  error ? (
    <ErrorStatus>{error?.message}</ErrorStatus>
  ) : (
    <Status status={readyToUse ? 'Ready' : 'Not Ready'} />
  );

export const SnapshotSimpleRow: React.FC<VMSnapshotSimpleRowProps> = ({
  data: snapshot,
  columnClasses,
  actionsComponent,
  index,
  style,
}) => {
  const dimensify = dimensifyRow(columnClasses);
  const name = getName(snapshot);
  const namespace = getNamespace(snapshot);
  const error = getVMSnapshotError(snapshot);
  const readyToUse = isVMSnapshotReady(snapshot);

  return (
    <TableRow id={snapshot?.metadata?.uid} index={index} trKey={name} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={referenceFor(VirtualMachineSnapshotModel)}
          namespace={namespace}
          name={name}
        />
      </TableData>
      <TableData className={dimensify()}>
        <Timestamp timestamp={getCreationTimestamp(snapshot)} />
      </TableData>
      <TableData className={dimensify()}>
        <VMSnapshotStatus error={error} readyToUse={readyToUse} />
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </TableRow>
  );
};

export const SnapshotRow: RowFunction<VMSnapshot, VMSnapshotRowCustomData> = ({
  obj: snapshot,
  customData: { withProgress, vmLikeEntity, columnClasses },
  index,
  style,
}) => (
  <SnapshotSimpleRow
    data={snapshot}
    columnClasses={columnClasses}
    index={index}
    style={style}
    actionsComponent={
      <Kebab
        options={getActions(snapshot, vmLikeEntity, { withProgress })}
        id={`kebab-for-${getName(snapshot)}`}
      />
    }
  />
);
