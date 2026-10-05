import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import type { ContextProvider } from '@console/dynamic-plugin-sdk/src/extensions/context-providers';
import { HttpError } from '@console/dynamic-plugin-sdk/src/utils/error/http-error';
import type { OperatorMigrationJob } from '../utils/operator-migration-api';
import { getOperatorMigrationJobs } from '../utils/operator-migration-api';
import {
  isOperatorMigrationJobActive,
  monitorOperatorMigrationJob,
  useOperatorMigrationToastCallbacks,
} from '../utils/operator-migration-notifications';

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

export const useMigrationNotifications = (): MigrationNotificationsValue => {
  const value = useContext(MigrationNotificationsContext);
  if (!value) {
    throw new Error('Migration notifications require OperatorMigrationNotificationsProvider');
  }
  return value;
};

// The extension's TECH_PREVIEW flag controls whether this hook mounts.
export const useOperatorMigrationNotifications: Awaited<
  ReturnType<MigrationNotificationsExtension['properties']['useValueHook']>
> = () => {
  const callbacks = useOperatorMigrationToastCallbacks();
  const toasts = useRef(callbacks);
  const execution = useRef<{
    controller: AbortController;
    monitors: Map<string, Promise<void>>;
  }>();
  useEffect(() => {
    toasts.current = callbacks;
  }, [callbacks]);

  const monitorMigration = useCallback((job: OperatorMigrationJob): Promise<void> => {
    const state = execution.current;
    if (!state || state.controller.signal.aborted) return Promise.resolve();
    const existing = state.monitors.get(job.id);
    if (existing) return existing;
    toasts.current.updateProgressToast(job);
    const promise = monitorOperatorMigrationJob(
      job.id,
      {
        updateProgressToast: (progress) => toasts.current.updateProgressToast(progress),
        addOperatorResultToasts: (result) => toasts.current.addOperatorResultToasts(result),
        showRetryToast: (jobID) => toasts.current.showRetryToast(jobID),
      },
      state.controller.signal,
    )
      .catch((error: Error) => {
        if (!state.controller.signal.aborted) toasts.current.showMonitorErrorToast(error);
      })
      .finally(() => state.monitors.delete(job.id));
    state.monitors.set(job.id, promise);
    return promise;
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    execution.current = { controller, monitors: new Map() };
    let timer: number;
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
