import { ONE_HOUR } from '@console/shared/src/constants/time';

// Constants
export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const ALERTMANAGER_BASE_PATH = window.SERVER_FLAGS.alertManagerBaseURL;
export const ALERTMANAGER_USER_WORKLOAD_BASE_PATH =
  window.SERVER_FLAGS.alertmanagerUserWorkloadBaseURL;
export const ALERTMANAGER_TENANCY_BASE_PATH = 'api/alertmanager-tenancy'; // remove it once it get added to SERVER_FLAGS
export const DEFAULT_PROMETHEUS_SAMPLES = 60;
export const DEFAULT_PROMETHEUS_TIMESPAN = ONE_HOUR;
