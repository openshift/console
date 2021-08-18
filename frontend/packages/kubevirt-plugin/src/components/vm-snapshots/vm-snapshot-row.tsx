import * as React from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { RowFunctionArgs, TableData } from '@console/internal/components/factory';
import { Kebab, ResourceKebab, ResourceLink, Timestamp } from '@console/internal/components/utils';
import { VirtualMachineSnapshotModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getCreationTimestamp, getName, getNamespace } from '../../selectors';
import {
  getVmRestoreTime,
  isVmRestoreProgressing,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import { VMRestore, VMSnapshot } from '../../types';
import { DASH, dimensifyRow } from '../../utils';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';
import { VMLabel } from '../VMLabel';
import { VMSnapshotRowCustomData } from './types';
import { VMSnapshotStatus } from './vm-snapshot-status';

const { Delete } = Kebab.factory;

export type VMSnapshotSimpleRowProps = {
  data: VMSnapshot;
  restores: { [key: string]: VMRestore };
  isDisabled: boolean;
  columnClasses: string[];
  actionsComponent: React.ReactNode;
  isVMRunning: boolean;
};

export const VMSnapshotSimpleRow: React.FC<VMSnapshotSimpleRowProps> = ({
  data: snapshot,
  restores,
  isDisabled,
  columnClasses,
  actionsComponent,
  isVMRunning,
}) => {
  const { t } = useTranslation();
  const dimensify = dimensifyRow(columnClasses);
  const snapshotName = getName(snapshot);
  const namespace = getNamespace(snapshot);
  const relevantRestore = restores[snapshotName];
  const indications = snapshot?.status?.indications;

  return (
    <>
      <TableData className={dimensify()}>
        <ResourceLink
          kind={kubevirtReferenceForModel(VirtualMachineSnapshotModel)}
          namespace={namespace}
          name={snapshotName}
        />
      </TableData>
      <TableData className={dimensify()}>
        <Timestamp timestamp={getCreationTimestamp(snapshot)} />
      </TableData>
      <TableData id={`${snapshotName}-snapshot-status`} className={dimensify()}>
        <VMSnapshotStatus snapshot={snapshot} restore={relevantRestore} />
      </TableData>
      <TableData id={`${snapshotName}-restore-time`} className={dimensify()}>
        {relevantRestore ? <Timestamp timestamp={getVmRestoreTime(relevantRestore)} /> : DASH}
      </TableData>
      <TableData id={`${snapshotName}-online-snapshot`} className={dimensify()}>
        {indications
          ? indications.map((indication) => (
              <VMLabel key={`${snapshotName}-${indication}`} indication={indication} />
            ))
          : DASH}
      </TableData>
      <TableData className={dimensify()}>
        <Tooltip
          content={t('kubevirt-plugin~Restore is enabled only for offline virtual machine.')}
        >
          <Button
            id={`${snapshotName}-restore-btn`}
            variant="secondary"
            onClick={() => snapshotRestoreModal({ snapshot })}
            isAriaDisabled={
              isDisabled ||
              !isVMSnapshotReady(snapshot) ||
              isVmRestoreProgressing(relevantRestore) ||
              isVMRunning
            }
          >
            {t('kubevirt-plugin~Restore')}
          </Button>
        </Tooltip>
      </TableData>
      <TableData className={dimensify(true)}>{actionsComponent}</TableData>
    </>
  );
};

export const VMSnapshotRow: React.FC<RowFunctionArgs<VMSnapshot, VMSnapshotRowCustomData>> = ({
  obj: snapshot,
  customData: { restores, columnClasses, isDisabled, isVMRunning },
}) => (
  <VMSnapshotSimpleRow
    data={snapshot}
    restores={restores}
    columnClasses={columnClasses}
    isDisabled={isDisabled}
    isVMRunning={isVMRunning}
    actionsComponent={
      <ResourceKebab
        resource={snapshot}
        kind={kubevirtReferenceForModel(VirtualMachineSnapshotModel)}
        isDisabled={isDisabled}
        actions={[Delete]}
        id={`kebab-for-${getName(snapshot)}`}
      />
    }
  />
);
