import * as React from 'react';
import { Button, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core';
import { history, resourcePath } from '@console/internal/components/utils';
import { getName, getNamespace, Status, ErrorStatus, ProgressStatus } from '@console/shared';
import { VirtualMachineRestoreModel } from '../../models';
import { VMRestore, VMSnapshot } from '../../types';
import {
  getVMRestoreError,
  getVMSnapshotError,
  isVmRestoreProgressing,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';

export const VMSnapshotStatus: React.FC<VMSnapshotStatusProps> = ({ snapshot, restore }) => {
  const snapshotError = getVMSnapshotError(snapshot);
  const restoreError = getVMRestoreError(restore);
  const isRestoreProgressing = isVmRestoreProgressing(restore);
  const snapshotReady = isVMSnapshotReady(snapshot);

  if (snapshotError) {
    return <ErrorStatus title={'Create Failed'}>{snapshotError?.message}</ErrorStatus>;
  }
  if (restoreError) {
    return (
      <ErrorStatus title={'Restore Failed'}>
        <Stack hasGutter>
          <StackItem>
            <strong>{getName(snapshot)}</strong> failed to restore due to: {restoreError?.message}
          </StackItem>
          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <Button variant="secondary" onClick={() => snapshotRestoreModal({ snapshot })}>
                  Try Again
                </Button>
              </SplitItem>
              <SplitItem>
                <Button
                  variant="link"
                  onClick={() =>
                    history.push(
                      resourcePath(
                        VirtualMachineRestoreModel.kind,
                        getName(restore),
                        getNamespace(restore),
                      ),
                    )
                  }
                >
                  Restore Details
                </Button>
              </SplitItem>
            </Split>
          </StackItem>
        </Stack>
      </ErrorStatus>
    );
  }
  if (isRestoreProgressing)
    return (
      <ProgressStatus title="Restoring">
        <Stack hasGutter>
          <StackItem>
            restoring from snapshot: <strong>{getName(snapshot)}</strong>
          </StackItem>
          <StackItem>
            <Button
              variant="secondary"
              onClick={() =>
                history.push(
                  resourcePath(
                    VirtualMachineRestoreModel.kind,
                    getName(restore),
                    getNamespace(restore),
                  ),
                )
              }
            >
              Restore Details
            </Button>
          </StackItem>
        </Stack>
      </ProgressStatus>
    );
  return snapshotReady ? <Status status="Ready" /> : <ProgressStatus title="Creating" />;
};

export type VMSnapshotStatusProps = {
  snapshot: VMSnapshot;
  restore: VMRestore;
};
