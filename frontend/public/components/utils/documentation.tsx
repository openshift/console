// Prefer the documentation base URL passed as a flag, but fall back to the latest docs if none was specified.
export const openshiftHelpBase =
  window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';

export const getNetworkPolicyDocLink = (openshiftFlag: boolean) => {
  return openshiftFlag
    ? `${openshiftHelpBase}networking/network_policy/about-network-policy.html`
    : 'https://kubernetes.io/docs/concepts/services-networking/network-policies/';
};
