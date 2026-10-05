import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export type OperatorMigrationAcknowledgements = {
  acknowledgeWatchScopeChange?: boolean;
  acknowledgeOperatorCondition?: boolean;
  acknowledgeOLMv0APIAccess?: boolean;
  acknowledgeScopedServiceAccount?: boolean;
  acknowledgeNotSteadyState?: boolean;
};

export type OperatorMigrationRequest = OperatorMigrationAcknowledgements & {
  subscriptionName: string;
  subscriptionNamespace: string;
  clusterExtensionName?: string;
  installNamespace?: string;
};

type OperatorMigrationCheck = {
  name: string;
  passed: boolean;
  message: string;
};

export type OperatorMigrationScan = {
  subscriptionName: string;
  subscriptionNamespace: string;
  clusterExtensionName?: string;
  installedCSV?: string;
  status: string;
  eligible: boolean;
  reason: string;
  error?: string;
  failedChecks?: OperatorMigrationCheck[];
  warnings?: string[];
};

export type OperatorMigrationPlan = {
  clusterExtensionName: string;
  installNamespace: string;
  packageName: string;
  version: string;
  channel?: string;
  clusterCatalog: string;
  clusterObjectSetName: string;
  resources: { kind: string; count: number }[];
  actions: string[];
};

export type OperatorMigrationDryRunResponse = {
  operator: OperatorMigrationScan;
  eligible: boolean;
  plan?: OperatorMigrationPlan;
  planningError?: string;
};

export type OperatorMigrationProgress = {
  step: string;
  status: string;
  target?: string;
  message?: string;
  error?: string;
};

type OperatorMigrationJobItem = {
  subscriptionName: string;
  subscriptionNamespace: string;
  clusterExtensionName?: string;
  status: 'Queued' | 'Checking' | 'Migrating' | 'Succeeded' | 'Failed' | 'Skipped' | string;
  progress?: string;
  progressEvent?: OperatorMigrationProgress;
  reason?: string;
  error?: string;
  rollbackAttempted?: boolean;
  rolledBack?: boolean;
};

export type OperatorMigrationJob = {
  id: string;
  status: string;
  message?: string;
  progressEvent?: OperatorMigrationProgress;
  continueOnError: boolean;
  items: OperatorMigrationJobItem[];
};

const SCAN_ENDPOINT = '/api/olm/migration/operators';
// Planning queries every serving catalog, including over a local port forward.
const MIGRATION_PLANNING_TIMEOUT = 5 * 60 * 1000;
const SCAN_CACHE_TTL = 30 * 1000;
export const OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT = 'olm-operator-migration-scan-invalidated';

type ScanCache = {
  data?: OperatorMigrationScan[];
  error?: Error;
  promise?: Promise<OperatorMigrationScan[]>;
  timestamp: number;
};

let scanCache: ScanCache | undefined;

/** Shares scan requests until expiry; invalidated requests cannot replace newer cache entries. */
export const getOperatorMigrationScans = (): Promise<OperatorMigrationScan[]> => {
  if (scanCache?.promise) {
    return scanCache.promise;
  }

  if (scanCache && Date.now() - scanCache.timestamp < SCAN_CACHE_TTL) {
    return scanCache.error
      ? Promise.reject(scanCache.error)
      : Promise.resolve(scanCache.data ?? []);
  }

  const entry: ScanCache = { timestamp: Date.now() };
  const promise = coFetchJSON(SCAN_ENDPOINT, 'GET', {}, MIGRATION_PLANNING_TIMEOUT).then(
    (data: OperatorMigrationScan[]) => {
      if (scanCache === entry) scanCache = { data, timestamp: Date.now() };
      return data;
    },
    (error: Error) => {
      if (scanCache === entry) scanCache = { error, timestamp: Date.now() };
      throw error;
    },
  );
  entry.promise = promise;
  scanCache = entry;
  return promise;
};

/** Discards cached scans and pending request ownership, then notifies scan consumers. */
export const invalidateOperatorMigrationScans = (): void => {
  scanCache = undefined;
  window.dispatchEvent(new Event(OPERATOR_MIGRATION_SCAN_INVALIDATED_EVENT));
};

export const dryRunOperatorMigration = (
  operator: OperatorMigrationRequest,
): Promise<OperatorMigrationDryRunResponse> =>
  coFetchJSON.post(
    '/api/olm/migration/dry-run',
    operator,
    {},
    MIGRATION_PLANNING_TIMEOUT,
  ) as Promise<OperatorMigrationDryRunResponse>;

export const startOperatorMigration = (
  operators: OperatorMigrationRequest[],
): Promise<{ jobID: string; status: string }> =>
  coFetchJSON.post(
    '/api/olm/migration/bulk',
    { operators, continueOnError: true },
    {},
    MIGRATION_PLANNING_TIMEOUT,
  ) as Promise<{ jobID: string; status: string }>;

export const getOperatorMigrationJob = (jobID: string): Promise<OperatorMigrationJob> =>
  coFetchJSON(
    `/api/olm/migration/jobs/${encodeURIComponent(jobID)}`,
    'GET',
  ) as Promise<OperatorMigrationJob>;

export const getOperatorMigrationJobs = (signal?: AbortSignal): Promise<OperatorMigrationJob[]> =>
  coFetchJSON('/api/olm/migration/jobs', 'GET', { signal }) as Promise<OperatorMigrationJob[]>;
