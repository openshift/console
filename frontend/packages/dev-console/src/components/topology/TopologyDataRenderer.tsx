import * as React from 'react';
import { Model } from '@patternfly/react-topology';
import { Alerts, PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { PROMETHEUS_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { TopologyDataResources, TrafficData } from './topology-types';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { baseDataModelGetter } from './data-transforms';

export interface RenderProps {
  showGraphView: boolean;
  model?: Model;
  namespace: string;
  loaded: boolean;
  loadError: string;
}

export interface TopologyDataRendererProps {
  showGraphView: boolean;
  kindsInFlight: boolean;
  resources: TopologyDataResources;
  render(props: RenderProps): React.ReactElement;
  namespace: string;
  trafficData?: TrafficData;
}

const POLL_DELAY = 15 * 1000;

export const TopologyDataRenderer: React.FC<TopologyDataRendererProps> = ({
  render,
  resources,
  kindsInFlight,
  trafficData,
  namespace,
  showGraphView,
}) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const [model, setModel] = React.useState<Model>(null);
  const [loadError, setLoadError] = React.useState<string>(null);

  const url = PROMETHEUS_TENANCY_BASE_PATH
    ? `${PROMETHEUS_TENANCY_BASE_PATH}/api/v1/rules?namespace=${namespace}`
    : null;
  const [response, error, loading] = useURLPoll<PrometheusRulesResponse>(
    url,
    POLL_DELAY,
    namespace,
  );

  const monitoringAlerts: Alerts = React.useMemo(() => {
    const { alerts } = getAlertsAndRules(response?.data);
    return { data: alerts, loaded: !loading, loadError: error };
  }, [response, error, loading]);

  React.useEffect(() => {
    const { extensionsLoaded, watchedResources } = dataModelContext;
    if (!extensionsLoaded) {
      setModel(null);
      return;
    }

    const resourcesLoaded =
      !kindsInFlight &&
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded || resources[key].loadError);
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
            monitoringAlerts,
          ),
        );
      })
      .catch(() => {});
  }, [resources, trafficData, dataModelContext, kindsInFlight, monitoringAlerts]);

  return render({
    loaded: !!model,
    loadError,
    namespace,
    model,
    showGraphView,
  });
};
