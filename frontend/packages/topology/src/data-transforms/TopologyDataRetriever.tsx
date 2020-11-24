import * as React from 'react';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { TopologyResourcesObject, TrafficData } from '../topology-types';
import { ModelContext, ExtensibleModel } from './ModelContext';
import { baseDataModelGetter } from './data-transformer';
import { getFilterById, SHOW_GROUPS_FILTER_ID, useDisplayFilters } from '../filters';

type TopologyDataRetrieverProps = {
  trafficData?: TrafficData;
};

const TopologyDataRetriever: React.FC<TopologyDataRetrieverProps> = ({ trafficData }) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { namespace } = dataModelContext;
  const filters = useDisplayFilters();
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
  const resourcesList = React.useMemo<WatchK8sResources<any>>(
    () => (dataModelContext.extensionsLoaded ? dataModelContext.watchedResources : {}),
    [dataModelContext.extensionsLoaded, dataModelContext.watchedResources],
  );

  const resources = useK8sWatchResources<TopologyResourcesObject>(resourcesList);
  const [alertsResponse, alertsError, alertsLoading] = usePrometheusRulesPoll({ namespace });
  const monitoringAlerts = React.useMemo(() => {
    let alertData;
    if (!alertsLoading && !alertsError) {
      alertData = getAlertsAndRules(alertsResponse?.data).alerts;

      // Don't update due to time changes
      alertData.forEach((alert) => {
        delete alert.activeAt;
        if (alert.rule) {
          delete alert.rule.evaluationTime;
          delete alert.rule.lastEvaluation;
          alert.rule.alerts &&
            alert.rule.alerts.forEach((ruleAlert) => {
              delete ruleAlert.activeAt;
            });
        }
      });
    }
    return { data: alertData, loaded: !alertsLoading, loadError: alertsError };
  }, [alertsError, alertsLoading, alertsResponse]);

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

    if (!Object.keys(resources).every((key) => resources[key].loaded)) {
      return;
    }

    const loadErrorKey = Object.keys(resources).find(
      (key) => resources[key].loadError && !watchedResources[key].optional,
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
  }, [resources, trafficData, dataModelContext, monitoringAlerts, showGroups]);

  return null;
};

export default TopologyDataRetriever;
