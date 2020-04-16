import * as React from 'react';
import { Model } from '@console/topology';
import { TopologyDataResources, TrafficData } from './topology-types';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { baseDataModelGetter } from './data-transforms';

export interface RenderProps {
  model?: Model;
  namespace: string;
  loaded: boolean;
  loadError: string;
}

export interface TopologyDataRendererProps {
  kindsInFlight: boolean;
  resources: TopologyDataResources;
  render(props: RenderProps): React.ReactElement;
  namespace: string;
  trafficData?: TrafficData;
}

export const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = ({
  render,
  resources,
  namespace,
  kindsInFlight,
  trafficData,
}) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const [model, setModel] = React.useState<Model>(null);
  const [loadError, setLoadError] = React.useState<string>(null);

  React.useEffect(() => {
    const { extensionsLoaded, watchedResources } = dataModelContext;
    if (!extensionsLoaded) {
      setModel(null);
      return;
    }

    const resourcesLoaded =
      !kindsInFlight &&
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded);
    if (!resourcesLoaded) {
      setModel(null);
      return;
    }

    const optionalResources = Object.keys(watchedResources).filter(
      (key) => watchedResources[key].optional,
    );
    const loadErrorKey = Object.keys(resources).find(
      (key) => resources[key].loadError && !optionalResources.includes(key),
    );
    setLoadError(loadErrorKey && resources[loadErrorKey].loadError);
    if (loadErrorKey) {
      setModel(null);
      return;
    }

    // Get Workload objects from extensions
    const workloadResources = dataModelContext.getWorkloadResources(resources);

    // Get model from each extension
    const extensions = dataModelContext.getExtensions();
    const depicters = Object.keys(extensions).map((key) => extensions[key].dataModelDepicter);
    dataModelContext
      .getExtensionModels(resources)
      .then((extensionsModel) => {
        setModel(
          baseDataModelGetter(
            extensionsModel,
            dataModelContext.namespace,
            resources,
            workloadResources,
            depicters,
            trafficData,
          ),
        );
      })
      .catch(() => {});
  }, [resources, trafficData, dataModelContext, kindsInFlight]);

  return render({
    loaded: !!model,
    loadError,
    namespace,
    model,
  });
};
