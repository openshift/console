
export const CONST = {
  title: 'Bridge',
  dateFmt: 'MM-dd-yyyy',
  timeFmt: 'HH:mm:ss a Z',
  placeholderText: '-',
  INVALID_POLICY: 'Unknown Configuration',

  // Kubernetes "dns-friendly" names match
  // [a-z0-9]([-a-z0-9]*[a-z0-9])?  and are 63 or fewer characters
  // long. This pattern checks the pattern but not the length.
  //
  // Don't capture anything in legalNamePattern, since it's used
  // in expressions like
  //
  //    new RegExp("PREFIX" + legalNamePattern.source + "(SUFFIX)")
  //
  // And it's ok for users to make assumptions about capturing groups.
  legalNamePattern: /[a-z0-9](?:[-a-z0-9]*[a-z0-9])?/,

  // http://kubernetes.io/docs/user-guide/images/#bypassing-kubectl-create-secrets
  PULL_SECRET_TYPE: 'kubernetes.io/dockerconfigjson',
  PULL_SECRET_DATA: '.dockerconfigjson',
};

export const EVENTS = {
  CONTAINER_REMOVE: 'container-remove',
};
