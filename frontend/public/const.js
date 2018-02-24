
export const CONST = {
  title: 'Bridge',
  dateFmt: 'MM-dd-yyyy',
  timeFmt: 'HH:mm:ss a Z',
  placeholderText: '-',
  INVALID_POLICY: 'Unknown Configuration',

  // http://kubernetes.io/docs/user-guide/images/#bypassing-kubectl-create-secrets
  PULL_SECRET_TYPE: 'kubernetes.io/dockerconfigjson',
  PULL_SECRET_DATA: '.dockerconfigjson',
};

export const EVENTS = {
  CONTAINER_REMOVE: 'container-remove',
};

export const NAMESPACE_LOCAL_STORAGE_KEY = 'dropdown-storage-namespaces';
