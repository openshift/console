import { K8sGroupVersionKind, K8sModel } from '@console/dynamic-plugin-sdk';
import { MachineConfigModel } from '@console/internal/models';

const resourcesToOmit: K8sGroupVersionKind[] = [
  {
    group: MachineConfigModel.apiGroup,
    version: MachineConfigModel.apiVersion,
    kind: MachineConfigModel.kind,
  },
  {
    group: 'machineconfiguration.openshift.io',
    version: 'v1',
    kind: 'KubeletConfig',
  },
  {
    group: 'machineconfiguration.openshift.io',
    version: 'v1',
    kind: 'ContainerRuntimeConfig',
  },
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
