import { useMemo } from 'react';
import { AlertVariant, Progress, ProgressSize } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { useToast } from '@console/shared/src/components/toast/useToast';
import type { OperatorMigrationJob } from './operator-migration-api';
import {
  getOperatorMigrationJob,
  invalidateOperatorMigrationScans,
} from './operator-migration-api';
import { useOperatorMigrationProgressText } from './operator-migration-progress';

const getTerminalCount = (job: OperatorMigrationJob): number =>
  job.items.filter(({ status }) => ['Succeeded', 'Failed', 'Skipped'].includes(status)).length;

export const useOperatorMigrationToastCallbacks = () => {
  const { t } = useTranslation('olm');
  const { getOperatorMigrationJobProgressText } = useOperatorMigrationProgressText();
  const { addToast } = useToast();
  return useMemo(() => {
    const getProgressContent = (job: OperatorMigrationJob) => {
      const total = job.items.length;
      const complete = getTerminalCount(job);
      const percentage = total > 0 ? Math.round((complete / total) * 100) : 0;
      const progressTitle = t('{{complete}} of {{total}} operators processed', {
        complete,
        total,
      });

      return (
        <div>
          <Progress value={percentage} title={progressTitle} size={ProgressSize.sm} />
          <div>{getOperatorMigrationJobProgressText(job)}</div>
        </div>
      );
    };

    const updateProgressToast = (job: OperatorMigrationJob) => {
      let title: string;
      switch (job.status) {
        case 'Succeeded':
          title = t('Operator migration completed');
          break;
        case 'CompletedWithErrors':
          title = t('Operator migration completed with errors');
          break;
        case 'Failed':
          title = t('Operator migration failed');
          break;
        case 'Cancelled':
          title = t('Operator migration cancelled');
          break;
        default:
          title = t('Operator migration in progress');
      }
      addToast({
        id: `olm-migration-job-${job.id}`,
        title,
        variant:
          job.status === 'CompletedWithErrors' || job.status === 'Failed'
            ? AlertVariant.warning
            : AlertVariant.info,
        content: getProgressContent(job),
        persistInDrawer: true,
        minimizable: true,
        dismissible: false,
        timeout: false,
        drawerGroup: t('Operator migrations'),
      });
    };

    const addOperatorResultToasts = (job: OperatorMigrationJob) => {
      job.items.forEach((item) => {
        if (item.status !== 'Succeeded' && item.status !== 'Failed') {
          return;
        }
        const operator = `${item.subscriptionNamespace}/${item.subscriptionName}`;
        const isSuccess = item.status === 'Succeeded';
        let content: string;
        if (isSuccess) {
          content = t('{{operator}} migrated to OLM v1 successfully.', { operator });
        } else if (item.rolledBack) {
          content = t(
            '{{operator}} migration failed and was rolled back automatically: {{error}}',
            {
              operator,
              error: item.error || t('No error details were provided.'),
            },
          );
        } else if (item.rollbackAttempted) {
          content = t(
            '{{operator}} migration failed and automatic rollback could not be completed: {{error}}',
            {
              operator,
              error: item.error || t('No error details were provided.'),
            },
          );
        } else {
          content = t('{{operator}} migration failed: {{error}}', {
            operator,
            error: item.error || t('No error details were provided.'),
          });
        }

        addToast({
          id: `olm-migration-result-${job.id}-${encodeURIComponent(operator)}`,
          title: isSuccess ? t('Operator migration completed') : t('Operator migration failed'),
          variant: isSuccess ? AlertVariant.success : AlertVariant.danger,
          content,
          persistInDrawer: true,
          dismissible: true,
          drawerGroup: t('Operator migrations'),
          timeout: false,
        });
      });
    };

    const showRetryToast = (jobID: string) => {
      addToast({
        id: `olm-migration-job-${jobID}`,
        title: t('Operator migration in progress'),
        variant: AlertVariant.info,
        content: t('Could not refresh migration status. Retrying.'),
        persistInDrawer: true,
        minimizable: true,
        dismissible: false,
        timeout: false,
        drawerGroup: t('Operator migrations'),
      });
    };

    const showMonitorErrorToast = (error: Error) => {
      addToast({
        title: t('Could not monitor operator migration'),
        variant: AlertVariant.danger,
        content: error.message,
        persistInDrawer: true,
        timeout: false,
        drawerGroup: t('Operator migrations'),
      });
    };

    return { updateProgressToast, addOperatorResultToasts, showRetryToast, showMonitorErrorToast };
  }, [addToast, getOperatorMigrationJobProgressText, t]);
};

export const isOperatorMigrationJobActive = (job: OperatorMigrationJob): boolean =>
  !['Succeeded', 'CompletedWithErrors', 'Failed', 'Cancelled'].includes(job.status);

const wait = (milliseconds: number, signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    // The abort callback closes over the handle assigned below.
    // eslint-disable-next-line prefer-const
    let timer: number;
    const done = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    timer = window.setTimeout(done, milliseconds);
    signal?.addEventListener('abort', done, { once: true });
    if (signal?.aborted) done();
  });

export const monitorOperatorMigrationJob = (
  jobID: string,
  callbacks: Pick<
    ReturnType<typeof useOperatorMigrationToastCallbacks>,
    'updateProgressToast' | 'addOperatorResultToasts' | 'showRetryToast'
  >,
  signal?: AbortSignal,
): Promise<void> => {
  const monitor = async (): Promise<void> => {
    while (!signal?.aborted) {
      let job: OperatorMigrationJob | undefined;
      try {
        // eslint-disable-next-line no-await-in-loop
        job = await getOperatorMigrationJob(jobID);
      } catch (error) {
        if (
          signal?.aborted ||
          (error instanceof HttpError && [401, 403, 404].includes(error.code))
        ) {
          return;
        }
        callbacks.showRetryToast(jobID);
        // eslint-disable-next-line no-await-in-loop
        await wait(3000, signal);
      }
      if (signal?.aborted) return;
      if (job) {
        callbacks.updateProgressToast(job);
        if (!isOperatorMigrationJobActive(job)) {
          callbacks.addOperatorResultToasts(job);
          invalidateOperatorMigrationScans();
          return;
        }
        // eslint-disable-next-line no-await-in-loop
        await wait(2000, signal);
      }
    }
  };
  return monitor();
};
