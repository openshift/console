import { K8sGroupVersionKind, K8sModel } from '@console/dynamic-plugin-sdk';

const resourcesToOmit: K8sGroupVersionKind[] = [
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'APIServer',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Authentication',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'OAuth',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'FeatureGate',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Scheduler',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Network',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Proxy',
  },
  {
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'DNS',
  },
];

const matchModel = (toMatchWith: K8sGroupVersionKind) => (model: K8sGroupVersionKind): boolean =>
  model.group === toMatchWith.group &&
  model.version === toMatchWith.version &&
  model.kind === toMatchWith.kind;

const filterNonUpgradableResources = (model: K8sModel): boolean => {
  return !resourcesToOmit.find(
    matchModel({ group: model.apiGroup, version: model.apiVersion, kind: model.kind }),
  );
};

export default filterNonUpgradableResources;
