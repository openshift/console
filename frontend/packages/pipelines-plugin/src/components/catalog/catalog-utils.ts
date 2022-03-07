import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { TektonConfigModel } from '../../models';
import { TektonHubTask } from '../../types/tektonHub';
import { TEKTON_HUB_INTEGRATION_KEY } from './const';

export const getClusterPlatform = (): string =>
  `${window.SERVER_FLAGS.GOOS}/${window.SERVER_FLAGS.GOARCH}`;

export const filterBySupportedPlatforms = (task: TektonHubTask): boolean => {
  const supportedPlatforms = task?.platforms.map((p) => p.name) ?? [];
  return supportedPlatforms.includes(getClusterPlatform());
};

export const useTektonHubIntegration = () => {
  const [config, configLoaded, configLoadErr] = useK8sGet<K8sResourceKind>(
    TektonConfigModel,
    'config',
  );
  if (config && configLoaded && !configLoadErr) {
    const devconsoleIntegrationEnabled = config.spec?.hub?.params?.find(
      (p) => p.name === TEKTON_HUB_INTEGRATION_KEY,
    );
    return devconsoleIntegrationEnabled ? devconsoleIntegrationEnabled.value : true;
  }
  return true;
};
