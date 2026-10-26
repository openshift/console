import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import { useOverlay } from '@console/dynamic-plugin-sdk/src/app/modal-support/useOverlay';
import type { ContextProvider } from '@console/dynamic-plugin-sdk/src/extensions/context-providers';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import { useToast } from '@console/shared/src/components/toast/useToast';
import type {
  OperatorMigrationJob,
  OperatorMigrationJobItem,
} from '../utils/operator-migration-api';
import { getOperatorMigrationJobs } from '../utils/operator-migration-api';
import {
  isOperatorMigrationJobActive,
  monitorOperatorMigrationJob,
  useOperatorMigrationToastCallbacks,
} from '../utils/operator-migration-notifications';
import { OperatorMigrationRollbackModalOverlay } from './modals/operator-migration-rollback-modal';

interface MigrationNotificationsValue extends ReturnType<
  typeof useOperatorMigrationToastCallbacks
> {
  monitorMigration: (job: OperatorMigrationJob) => Promise<void>;
}
const MigrationNotificationsContext = createContext<MigrationNotificationsValue | undefined>(
  undefined,
);
export const OperatorMigrationNotificationsProvider: Awaited<
  ReturnType<ContextProvider<MigrationNotificationsValue>['properties']['provider']>
> = MigrationNotificationsContext.Provider;

/** Requires the migration context and exposes localized toast and monitoring callbacks. */
export const useMigrationNotifications = (): MigrationNotificationsValue => {
  const value = useContext(MigrationNotificationsContext);
  if (!value) {
    throw new Error('Migration notifications require OperatorMigrationNotificationsProvider');
  }
  return value;
};

// The extension's TECH_PREVIEW flag controls whether this hook mounts.
/** Restores active progress and unseen failures after session reload, deduplicating job monitors and result notifications. */
export const useOperatorMigrationNotifications: Awaited<
  ReturnType<ContextProvider<MigrationNotificationsValue>['properties']['useValueHook']>
> = () => {
  const launchOverlay = useOverlay();
  const { removeToast } = useToast();
  const toasts = useRef<ReturnType<typeof useOperatorMigrationToastCallbacks>>();
  const execution = useRef<{
    controller: AbortController;
    monitors: Map<string, Promise<void>>;
    reported: Set<string>;
  }>();

  /** Deduplicates job polling under the provider lifetime and forwards updates through current localized callbacks. */
  const monitorMigration = useCallback((job: OperatorMigrationJob): Promise<void> => {
    const state = execution.current;
    if (!state || state.controller.signal.aborted) return Promise.resolve();
    const existing = state.monitors.get(job.id);
    if (existing) return existing;
    toasts.current?.updateProgressToast(job);
    const promise = monitorOperatorMigrationJob(
      job.id,
      {
        updateProgressToast: (progress) => {
          if (!isOperatorMigrationJobActive(progress)) state.reported.add(progress.id);
          toasts.current?.updateProgressToast(progress);
        },
        addOperatorResultToasts: (result) => toasts.current?.addOperatorResultToasts(result),
        showRetryToast: (jobID) => toasts.current?.showRetryToast(jobID, job.operation),
      },
      state.controller.signal,
    )
      .catch((error: Error) => {
        if (!state.controller.signal.aborted) toasts.current?.showMonitorErrorToast(error);
      })
      .finally(() => state.monitors.delete(job.id));
    state.monitors.set(job.id, promise);
    return promise;
  }, []);

  /** Opens confirmed recovery with the original job identity and removes the obsolete failure alert after acceptance. */
  const requestRollback = useCallback(
    (job: OperatorMigrationJob, item: OperatorMigrationJobItem) => {
      launchOverlay(OperatorMigrationRollbackModalOverlay, {
        jobID: job.sourceJobID || job.id,
        item,
        monitorMigration,
        onRollbackStarted: () =>
          removeToast(
            `olm-migration-result-${job.id}-${encodeURIComponent(`${item.subscriptionNamespace}/${item.subscriptionName}`)}`,
          ),
      });
    },
    [launchOverlay, monitorMigration, removeToast],
  );
  const callbacks = useOperatorMigrationToastCallbacks(requestRollback);
  useEffect(() => {
    toasts.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const controller = new AbortController();
    const state = {
      controller,
      monitors: new Map<string, Promise<void>>(),
      reported: new Set<string>(),
    };
    execution.current = state;
    let timer: number;
    /** Restores active work and unseen failures, retrying temporary outages until authorization or provider lifetime ends. */
    const discover = async () => {
      try {
        const jobs = await getOperatorMigrationJobs(controller.signal);
        if (controller.signal.aborted) return;
        // The API orders jobs by creation time. A newer recovery attempt
        // supersedes the original failure for the same operator.
        const latest = new Map<string, string>();
        const resultKey = (item: OperatorMigrationJobItem) =>
          `${item.subscriptionNamespace}/${item.subscriptionName}`;
        jobs.forEach((job) => {
          job.items.forEach((item) => latest.set(resultKey(item), job.id));
        });
        jobs.forEach((job) => {
          if (isOperatorMigrationJobActive(job)) {
            if (!state.reported.has(job.id)) monitorMigration(job);
          } else if (!state.reported.has(job.id) && !state.monitors.has(job.id)) {
            state.reported.add(job.id);
            const failures = job.items.filter(
              (item) => item.status === 'Failed' && latest.get(resultKey(item)) === job.id,
            );
            const current = job.items.some((item) => latest.get(resultKey(item)) === job.id);
            if (failures.length || (job.status === 'Failed' && (!job.items.length || current))) {
              toasts.current?.updateProgressToast(job);
              toasts.current?.addOperatorResultToasts({ ...job, items: failures });
            }
          }
        });
      } catch (error) {
        if (error instanceof HttpError && [401, 403].includes(error.code)) return;
        // A backend restart or temporary connection loss does not end migration.
      }
      if (!controller.signal.aborted) timer = window.setTimeout(discover, 5000);
    };
    discover();
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [monitorMigration]);
  return useMemo(() => ({ ...callbacks, monitorMigration }), [callbacks, monitorMigration]);
};
