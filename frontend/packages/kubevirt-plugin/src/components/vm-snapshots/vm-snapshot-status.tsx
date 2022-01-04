import * as React from 'react';
import { Button, Split, SplitItem, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { history, resourcePath } from '@console/internal/components/utils';
import { ErrorStatus, ProgressStatus, Status } from '@console/shared';
import { CREATING, READY } from '../../constants/vm-snapshot';
import { VirtualMachineRestoreModel } from '../../models';
import { kubevirtReferenceForModel } from '../../models/kubevirtReferenceForModel';
import { getName, getNamespace } from '../../selectors';
import {
  getVMRestoreError,
  getVMSnapshotError,
  isVmRestoreProgressing,
  isVMSnapshotReady,
} from '../../selectors/snapshot/snapshot';
import { VMRestore, VMSnapshot } from '../../types';
import snapshotRestoreModal from '../modals/snapshot-restore-modal/snapshot-restore-modal';

export const VMSnapshotStatus: React.FC<VMSnapshotStatusProps> = ({ snapshot, restore }) => {
  const { t } = useTranslation();
  const snapshotError = getVMSnapshotError(snapshot);
  const restoreError = getVMRestoreError(restore);
  const isRestoreProgressing = isVmRestoreProgressing(restore);
  const snapshotReady = isVMSnapshotReady(snapshot);

  if (snapshotError) {
    return (
      <ErrorStatus title={t('kubevirt-plugin~Create Failed')}>{snapshotError?.message}</ErrorStatus>
    );
  }
  if (restoreError) {
    return (
      <ErrorStatus title={t('kubevirt-plugin~Restore Failed')}>
        <Stack hasGutter>
          <StackItem>
            <strong>{getName(snapshot)}</strong> {t('kubevirt-plugin~failed to restore due to:')}{' '}
            {restoreError?.message}
          </StackItem>
          <StackItem>
            <Split hasGutter>
              <SplitItem>
                <Button variant="secondary" onClick={() => snapshotRestoreModal({ snapshot })}>
                  {t('kubevirt-plugin~Try Again')}
                </Button>
              </SplitItem>
              <SplitItem>
                <Button
                  variant="link"
                  onClick={() =>
                    history.push(
                      resourcePath(
                        kubevirtReferenceForModel(VirtualMachineRestoreModel),
                        getName(restore),
                        getNamespace(restore),
                      ),
                    )
                  }
                >
                  {t('kubevirt-plugin~Restore Details')}
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
      <ProgressStatus title={t('kubevirt-plugin~Restoring')}>
        <Stack hasGutter>
          <StackItem>
            {t('kubevirt-plugin~restoring from snapshot: ')} <strong>{getName(snapshot)}</strong>
          </StackItem>
          <StackItem>
            <Button
              variant="secondary"
              onClick={() =>
                history.push(
                  resourcePath(
                    kubevirtReferenceForModel(VirtualMachineRestoreModel),
                    getName(restore),
                    getNamespace(restore),
                  ),
                )
              }
            >
              {t('kubevirt-plugin~Restore Details')}
            </Button>
          </StackItem>
        </Stack>
      </ProgressStatus>
    );
  return snapshotReady ? <Status status={READY} /> : <ProgressStatus title={CREATING} />;
};

export type VMSnapshotStatusProps = {
  snapshot: VMSnapshot;
  restore: VMRestore;
};
