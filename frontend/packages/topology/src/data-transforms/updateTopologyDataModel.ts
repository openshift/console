import { Model } from '@patternfly/react-topology';
import { Alerts } from '@console/internal/components/monitoring/types';
import { WatchK8sResults } from '@console/internal/components/utils/k8s-watch-hook';
import { TopologyResourcesObject, TrafficData } from '../topology-types';
import { baseDataModelGetter } from './data-transformer';
import { ExtensibleModel } from './ModelContext';

export const updateTopologyDataModel = (
  dataModelContext: ExtensibleModel,
  resources: WatchK8sResults<TopologyResourcesObject>,
  showGroups: boolean,
  trafficData: TrafficData,
  monitoringAlerts: Alerts,
): Promise<{ loaded: boolean; loadError: string; model: Model }> => {
  const { extensionsLoaded, watchedResources } = dataModelContext;
  if (!extensionsLoaded || !resources) {
    return Promise.resolve({ loaded: false, loadError: '', model: null });
  }

  const getLoadError = (key) => {
    if (resources[key].loadError && !watchedResources[key].optional) {
      return resources[key].loadError;
    }
    return '';
  };

  const isLoaded = (key) => {
    return resources[key].loaded || (resources[key].loadError && watchedResources[key].optional);
  };

  const loadErrorKey = Object.keys(resources).find((key) => getLoadError(key));
  if (loadErrorKey) {
    return Promise.resolve({
      loaded: false,
      loadError: resources[loadErrorKey].loadError,
      model: null,
    });
  }

  if (!Object.keys(resources).every((key) => isLoaded(key))) {
    return Promise.resolve({ loaded: false, loadError: '', model: null });
  }

  // Get Workload objects from extensions
  const workloadResources = dataModelContext.getWorkloadResources(resources);

  // Get model from each extension
  const depicters = dataModelContext.dataModelDepicters;
  return dataModelContext.getExtensionModels(resources).then((extensionsModel) => {
    const fullModel = baseDataModelGetter(
      extensionsModel,
      dataModelContext.namespace,
      resources,
      workloadResources,
      showGroups ? depicters : [],
      trafficData,
      monitoringAlerts,
    );
    dataModelContext.reconcileModel(fullModel, resources);
    return Promise.resolve({ loaded: true, loadError: '', model: fullModel });
  });
};
