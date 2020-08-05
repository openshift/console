import * as React from 'react';
import { connect } from 'react-redux';
import { Model } from '@patternfly/react-topology';
import { Alerts, PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { RootState } from '@console/internal/redux';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { PROMETHEUS_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { TopologyDataResources, TrafficData } from './topology-types';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { baseDataModelGetter } from './data-transforms';
import { getFilterById, useDisplayFilters, SHOW_GROUPS_FILTER_ID } from './filters';

export interface RenderProps {
  showGraphView: boolean;
  model?: Model;
  namespace: string;
  loaded: boolean;
  loadError: string;
}

interface StateProps {
  kindsInFlight: boolean;
}

export interface TopologyDataRendererProps {
  showGraphView: boolean;
  resources: TopologyDataResources;
  render(props: RenderProps): React.ReactElement;
  namespace: string;
  trafficData?: TrafficData;
}

const POLL_DELAY = 15 * 1000;

export const ConnectedTopologyDataRenderer: React.FC<TopologyDataRendererProps & StateProps> = ({
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
  const filters = useDisplayFilters();
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;

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

  // Wipe the current model on a namespace change
  React.useEffect(() => {
    setModel(null);
  }, [namespace]);

  React.useEffect(() => {
    const { extensionsLoaded, watchedResources } = dataModelContext;
    if (!extensionsLoaded) {
      return;
    }

    const resourcesLoaded =
      !kindsInFlight &&
      Object.keys(resources).length > 0 &&
      Object.keys(resources).every((key) => resources[key].loaded || resources[key].loadError) &&
      !Object.keys(resources).every((key) => resources[key].loadError);
    if (!resourcesLoaded) {
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
        const fullModel = baseDataModelGetter(
          extensionsModel,
          dataModelContext.namespace,
          resources,
          workloadResources,
          showGroups ? depicters : [],
          trafficData,
          monitoringAlerts,
        );
        dataModelContext.model = fullModel;
        setModel(fullModel);
      })
      .catch(() => {});
  }, [resources, trafficData, dataModelContext, kindsInFlight, monitoringAlerts, showGroups]);

  return render({
    loaded: !!model,
    loadError,
    namespace,
    model,
    showGraphView,
  });
};
const stateToProps = (state: RootState) => {
  return {
    kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  };
};

export const TopologyDataRenderer = connect(stateToProps)(ConnectedTopologyDataRenderer);
