import { useMemo } from 'react';
import { AlertVariant, Progress, ProgressSize } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { useToast } from '@console/shared/src/components/toast/useToast';
import type { OperatorMigrationJob, OperatorMigrationJobItem } from './operator-migration-api';
import {
  getOperatorMigrationJob,
  invalidateOperatorMigrationScans,
} from './operator-migration-api';
import { useOperatorMigrationProgressText } from './operator-migration-progress';

/** Counts processed batch items for progress percentages. */
const getTerminalCount = (job: OperatorMigrationJob): number =>
  job.items.filter(({ status }) => ['Succeeded', 'Failed', 'Skipped'].includes(status)).length;

/** Distinguishes queued, running, scanning, and cancellation-requested jobs from terminal outcomes. */
export const isOperatorMigrationJobActive = (job: OperatorMigrationJob): boolean =>
  !['Succeeded', 'CompletedWithErrors', 'Failed', 'Cancelled'].includes(job.status);

/** Offers explicit recovery of a failed operator only after its owning batch has finished. */
const canOfferRollback = (job: OperatorMigrationJob, item: OperatorMigrationJobItem): boolean =>
  !isOperatorMigrationJobActive(job) &&
  item.status === 'Failed' &&
  !item.rolledBack &&
  Boolean(item.rollbackAttempted && item.clusterExtensionName);

/** Creates localized progress, per-operator result, retry, and recovery-action toast callbacks. */
export const useOperatorMigrationToastCallbacks = (
  onRollback?: (job: OperatorMigrationJob, item: OperatorMigrationJobItem) => void,
) => {
  const { t } = useTranslation('olm');
  const { getOperatorMigrationJobProgressText } = useOperatorMigrationProgressText();
  const { addToast } = useToast();
  return useMemo(() => {
    /** Builds processed-item progress and the localized structured job label. */
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

    /** Updates a persistent job notification with distinct migration or rollback terminal titles. */
    const updateProgressToast = (job: OperatorMigrationJob) => {
      let title: string;
      switch (job.status) {
        case 'Succeeded':
          title =
            job.operation === 'Rollback'
              ? t('Operator rollback completed')
              : t('Operator migration completed');
          break;
        case 'CompletedWithErrors':
          title = t('Operator migration completed with errors');
          break;
        case 'Failed':
          title =
            job.operation === 'Rollback'
              ? t('Operator rollback failed')
              : t('Operator migration failed');
          break;
        case 'Cancelled':
          title = t('Operator migration cancelled');
          break;
        default:
          title =
            job.operation === 'Rollback'
              ? t('Operator rollback in progress')
              : t('Operator migration in progress');
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

    /** Adds per-operator outcomes and offers explicit recovery only for eligible failed migrations. */
    const addOperatorResultToasts = (job: OperatorMigrationJob) => {
      job.items.forEach((item) => {
        if (item.status !== 'Succeeded' && item.status !== 'Failed') {
          return;
        }
        const operator = `${item.subscriptionNamespace}/${item.subscriptionName}`;
        const isSuccess = item.status === 'Succeeded';
        let content: string;
        if (job.operation === 'Rollback') {
          content = isSuccess
            ? t('{{operator}} was restored to Classic Operators.', { operator })
            : t('{{operator}} rollback failed. The recovery checkpoint was retained: {{error}}', {
                operator,
                error: item.error || t('No error details were provided.'),
              });
        } else if (isSuccess) {
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
          title:
            job.operation === 'Rollback'
              ? isSuccess
                ? t('Operator rollback completed')
                : t('Operator rollback failed')
              : isSuccess
                ? t('Operator migration completed')
                : t('Operator migration failed'),
          variant: isSuccess ? AlertVariant.success : AlertVariant.danger,
          content,
          actions:
            canOfferRollback(job, item) && onRollback
              ? [
                  {
                    label: t('Roll back to Classic Operators'),
                    callback: () => onRollback(job, item),
                    dataTest: 'rollback-operator-migration',
                  },
                ]
              : undefined,
          persistInDrawer: true,
          dismissible: true,
          drawerGroup: t('Operator migrations'),
          timeout: false,
        });
      });
    };

    /** Keeps a job's progress notification visible during temporary backend polling outages. */
    const showRetryToast = (jobID: string, operation?: OperatorMigrationJob['operation']) => {
      addToast({
        id: `olm-migration-job-${jobID}`,
        title:
          operation === 'Rollback'
            ? t('Operator rollback in progress')
            : t('Operator migration in progress'),
        variant: AlertVariant.info,
        content:
          operation === 'Rollback'
            ? t('Could not refresh rollback status. Retrying.')
            : t('Could not refresh migration status. Retrying.'),
        persistInDrawer: true,
        minimizable: true,
        dismissible: false,
        timeout: false,
        drawerGroup: t('Operator migrations'),
      });
    };

    /** Shows a monitoring failure when the provider is still active. */
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
  }, [addToast, getOperatorMigrationJobProgressText, onRollback, t]);
};

/** Waits between polls and resolves early when monitoring is aborted. */
const wait = (milliseconds: number, signal?: AbortSignal): Promise<void> =>
  new Promise<void>((resolve) => {
    // The abort callback closes over the handle assigned below.
    // eslint-disable-next-line prefer-const
    let timer: number;
    /** Clears the polling delay and abort listener before resolving the wait. */
    const done = () => {
      window.clearTimeout(timer);
      signal?.removeEventListener('abort', done);
      resolve();
    };
    timer = window.setTimeout(done, milliseconds);
    signal?.addEventListener('abort', done, { once: true });
    if (signal?.aborted) done();
  });

/** Polls an owned job, reports each operator result once, retries outages, and invalidates eligibility on completion. */
export const monitorOperatorMigrationJob = (
  jobID: string,
  callbacks: Pick<
    ReturnType<typeof useOperatorMigrationToastCallbacks>,
    'updateProgressToast' | 'addOperatorResultToasts' | 'showRetryToast'
  >,
  signal?: AbortSignal,
): Promise<void> => {
  const reportedResults = new Map<
    string,
    { status: OperatorMigrationJobItem['status']; canRollback: boolean }
  >();
  /** Polls until terminal state or abort, stopping on authentication, authorization, or removed-job responses. */
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
        const results = job.items.filter((item) => {
          if (item.status !== 'Succeeded' && item.status !== 'Failed') return false;
          const key = `${item.subscriptionNamespace}/${item.subscriptionName}`;
          const canRollback = canOfferRollback(job, item);
          const previous = reportedResults.get(key);
          if (previous?.status === item.status && previous.canRollback === canRollback) {
            return false;
          }
          reportedResults.set(key, { status: item.status, canRollback });
          return true;
        });
        if (results.length > 0) callbacks.addOperatorResultToasts({ ...job, items: results });
        if (!isOperatorMigrationJobActive(job)) {
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
