import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { TableData, TableRow, RowFunction } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { getName, getNamespace, dimensifyRow, getCreationTimestamp, DASH } from '@console/shared';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { VirtualMachineSnapshotModel } from '../../models';
import { VMSnapshotRowCustomData } from './types';
import { VMRestore, VMSnapshot } from '../../types';
import {
  getVmRestoreTime,
  isVmRestoreProgressing,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';
import { VMSnapshotStatus } from './vm-snapshot-status';

const { Delete } = Kebab.factory;

export type VMSnapshotSimpleRowProps = {
  data: VMSnapshot;
  restores: { [key: string]: VMRestore };
  isDisabled: boolean;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  index: number;
  style: object;
};

export const VMSnapshotSimpleRow: React.FC<VMSnapshotSimpleRowProps> = ({
  data: snapshot,
  restores,
  isDisabled,
  columnClasses,
  actionsComponent,
  index,
  style,
}) => {
  const dimensify = dimensifyRow(columnClasses);
  const snapshotName = getName(snapshot);
  const namespace = getNamespace(snapshot);
  const relevantRestore = restores[snapshotName];

  return (
    <TableRow id={snapshot?.metadata?.uid} index={index} trKey={snapshotName} style={style}>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={referenceFor(VirtualMachineSnapshotModel)}
          namespace={namespace}
          name={snapshotName}
        />
      </TableData>
      <TableData className={dimensify()}>
        <Timestamp timestamp={getCreationTimestamp(snapshot)} />
      </TableData>
      <TableData className={dimensify()}>
        <VMSnapshotStatus snapshot={snapshot} restore={relevantRestore} />
      </TableData>
      <TableData className={dimensify()}>
        {relevantRestore ? <Timestamp timestamp={getVmRestoreTime(relevantRestore)} /> : DASH}
      </TableData>
      <TableData className={dimensify()}>
        <Button
          variant="secondary"
          onClick={() => snapshotRestoreModal({ snapshot })}
          isDisabled={
            isDisabled || !isVMSnapshotReady(snapshot) || isVmRestoreProgressing(relevantRestore)
          }
        >
          Restore
        </Button>
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </TableRow>
  );
};

export const VMSnapshotRow: RowFunction<VMSnapshot, VMSnapshotRowCustomData> = ({
  obj: snapshot,
  customData: { restores, columnClasses, isDisabled },
  index,
  style,
}) => (
  <VMSnapshotSimpleRow
    data={snapshot}
    restores={restores}
    columnClasses={columnClasses}
    index={index}
    style={style}
    isDisabled={isDisabled}
    actionsComponent={
      <ResourceKebab
        resource={snapshot}
        kind={referenceForModel(VirtualMachineSnapshotModel)}
        isDisabled={isDisabled}
        actions={[Delete]}
        id={`kebab-for-${getName(snapshot)}`}
      />
    }
  />
);
