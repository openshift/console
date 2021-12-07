// Prefer the documentation base URL passed as a flag, but fall back to the latest docs if none was specified.
export const openshiftHelpBase =
  window.SERVER_FLAGS.documentationBaseURL || 'https://docs.okd.io/latest/';

export const isUpstream = () => window.SERVER_FLAGS.branding === 'okd';

export const getNetworkPolicyDocLink = (openshiftFlag: boolean) => {
  const networkLink = isUpstream()
    ? `${openshiftHelpBase}networking/network_policy/about-network-policy.html`
    : `${openshiftHelpBase}html/networking/network-policy#about-network-policy`;

  return openshiftFlag
    ? networkLink
    : 'https://kubernetes.io/docs/concepts/services-networking/network-policies/';
};
