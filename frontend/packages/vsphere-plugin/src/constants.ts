export const VSPHERE_FEATURE_FLAG = 'VSPHERECONNECTION';
export const VSPHERE_PLATFORM = 'VSphere';

export const VSPHERE_CREDS_SECRET_NAME = 'vsphere-creds';
export const VSPHERE_CREDS_SECRET_NAMESPACE = 'kube-system';

export const VSPHERE_CONFIGMAP_NAME = 'cloud-provider-config';
export const VSPHERE_CONFIGMAP_NAMESPACE = 'openshift-config';

export const KUBE_CONTROLLER_MANAGER_NAME = 'cluster';

export const MAX_RETRY_ATTEMPTS = 60;
export const MAX_RETRY_ATTEMPTS_CO = 10 * 60; // For monitoring cluster operators, total timeout: MAX_RETRY_ATTEMPTS_CO x DELAY_BEFORE_POLLING_RETRY == 20 minutes
export const MAX_RETRY_ATTEMPTS_CO_QUICK = 30; // DELAY_BEFORE_POLLING_RETRY x MAX_RETRY_ATTEMPTS_CO_QUICK ~ 1 minute
export const DELAY_BEFORE_POLLING_RETRY = 2 * 1000; // in ms
export const DELAY_BEFORE_POLLING_RETRY_MEDIUM = DELAY_BEFORE_POLLING_RETRY * 4;
