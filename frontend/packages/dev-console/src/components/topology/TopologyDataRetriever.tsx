import * as React from 'react';
import { connect } from 'react-redux';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { PROMETHEUS_TENANCY_BASE_PATH } from '@console/internal/components/graphs';
import { useURLPoll } from '@console/internal/components/utils/url-poll-hook';
import { Alerts, PrometheusRulesResponse } from '@console/internal/components/monitoring/types';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { RootState } from '@console/internal/redux';
import { TopologyResourcesObject, TrafficData } from './topology-types';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { baseDataModelGetter } from './data-transforms';
import { getFilterById, SHOW_GROUPS_FILTER_ID, useDisplayFilters } from './filters';

interface StateProps {
  kindsInFlight: boolean;
}

export type TopologyDataRetrieverProps = {
  trafficData?: TrafficData;
};

const POLL_DELAY = 15 * 1000;

export const ConnectedTopologyDataRetriever: React.FC<TopologyDataRetrieverProps & StateProps> = ({
  kindsInFlight,
  trafficData,
}) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { namespace } = dataModelContext;
  const filters = useDisplayFilters();
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
  const resourcesList = React.useMemo<WatchK8sResources<any>>(
    () => (dataModelContext.extensionsLoaded ? dataModelContext.watchedResources : {}),
    [dataModelContext.extensionsLoaded, dataModelContext.watchedResources],
  );

  const resources = useK8sWatchResources<TopologyResourcesObject>(resourcesList);

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
    dataModelContext.model = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    dataModelContext.loadError = loadErrorKey && resources[loadErrorKey].loadError;
    if (loadErrorKey) {
      return;
    }

    // Get Workload objects from extensions
    const workloadResources = dataModelContext.getWorkloadResources(resources);

    // Get model from each extension
    const depicters = dataModelContext.dataModelDepicters;
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
        dataModelContext.reconcileModel(fullModel, resources);
        dataModelContext.loaded = true;
        dataModelContext.model = fullModel;
      })
      .catch(() => {});
  }, [resources, trafficData, dataModelContext, kindsInFlight, monitoringAlerts, showGroups]);

  return null;
};

const stateToProps = (state: RootState) => {
  return {
    kindsInFlight: state.k8s.getIn(['RESOURCES', 'inFlight']),
  };
};
export const TopologyDataRetriever = connect(stateToProps)(ConnectedTopologyDataRetriever);
