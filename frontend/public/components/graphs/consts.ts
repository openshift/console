import { ONE_HOUR } from '@console/shared/src/constants/time';

// Constants
export const PROMETHEUS_BASE_PATH = window.SERVER_FLAGS.prometheusBaseURL;
export const PROMETHEUS_TENANCY_BASE_PATH = window.SERVER_FLAGS.prometheusTenancyBaseURL;
export const DEFAULT_PROMETHEUS_SAMPLES = 60;
export const DEFAULT_PROMETHEUS_TIMESPAN = ONE_HOUR;
