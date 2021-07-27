import * as React from 'react';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { BuildConfigOverviewItem } from '../types';
import { getBuildConfigsForResource } from '../utils';

export type BuildConfigData = {
  loaded: boolean;
  loadError: string;
  buildConfigs: BuildConfigOverviewItem[];
};

export const useBuildConfigsWatcher = (resource: K8sResourceKind): BuildConfigData => {
  const { namespace } = resource.metadata;
  const watchedResources = React.useMemo(
    () => ({
      buildConfigs: {
        isList: true,
        kind: 'BuildConfig',
        namespace,
      },
      builds: {
        isList: true,
        kind: 'Build',
        namespace,
      },
    }),
    [namespace],
  );

  const resources = useK8sWatchResources(watchedResources);

  const result = React.useMemo(() => {
    const resourceWithLoadError = Object.values(resources).find((r) => r.loadError);
    if (resourceWithLoadError) {
      return { loaded: false, loadError: resourceWithLoadError.loadError, buildConfigs: null };
    }
    if (
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded)
    ) {
      const resourceBuildConfigs = getBuildConfigsForResource(resource, resources);
      return { loaded: true, loadError: null, buildConfigs: resourceBuildConfigs };
    }
    return { loaded: false, loadError: null, buildConfigs: null };
  }, [resource, resources]);

  return result;
};
