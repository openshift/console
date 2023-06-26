import { useK8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';

export const useConnectionModels = () => {
  const [secretModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'Secret' });
  const [configMapModel] = useK8sModel({ group: 'app', version: 'v1', kind: 'ConfigMap' });
  const [kubeControllerManagerModel] = useK8sModel({
    group: 'operator.openshift.io',
    version: 'v1',
    kind: 'KubeControllerManager',
  });
  const [nodeModel] = useK8sModel({ group: 'core', version: 'v1', kind: 'Node' });
  const [infrastructureModel] = useK8sModel({
    group: 'config.openshift.io',
    version: 'v1',
    kind: 'Infrastructure',
  });
  return {
    secretModel,
    configMapModel,
    kubeControllerManagerModel,
    nodeModel,
    infrastructureModel,
  };
};
