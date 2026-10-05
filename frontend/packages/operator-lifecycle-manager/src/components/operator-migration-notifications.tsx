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

type MigrationNotificationsValue = ReturnType<typeof useOperatorMigrationToastCallbacks> & {
  monitorMigration: (job: OperatorMigrationJob) => Promise<void>;
};
type MigrationNotificationsExtension = ContextProvider<MigrationNotificationsValue>;
const MigrationNotificationsContext = createContext<MigrationNotificationsValue | undefined>(
  undefined,
);
export const OperatorMigrationNotificationsProvider: Awaited<
  ReturnType<MigrationNotificationsExtension['properties']['provider']>
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
/** Owns discovery and deduplicated monitors for active jobs, restoring progress after session reload. */
export const useOperatorMigrationNotifications: Awaited<
  ReturnType<MigrationNotificationsExtension['properties']['useValueHook']>
> = () => {
  const launchOverlay = useOverlay();
  const { removeToast } = useToast();
  const toasts = useRef<ReturnType<typeof useOperatorMigrationToastCallbacks>>();
  const execution = useRef<{
    controller: AbortController;
    monitors: Map<string, Promise<void>>;
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
        updateProgressToast: (progress) => toasts.current?.updateProgressToast(progress),
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
    execution.current = { controller, monitors: new Map() };
    let timer: number;
    /** Discovers owned active jobs, retries transient failures, and stops scheduling after authorization failures. */
    const discover = async () => {
      try {
        const jobs = await getOperatorMigrationJobs(controller.signal);
        if (controller.signal.aborted) return;
        jobs.filter(isOperatorMigrationJobActive).forEach((job) => {
          monitorMigration(job);
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
