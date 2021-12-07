import testIcon from '../components/test-icon';

export const icon = { default: testIcon };

export const getLandingPageURL = () => '/dynamic-route-1';

export const getImportRedirectURL = (namespace: string) => `/k8s/cluster/projects/${namespace}/workloads`;
