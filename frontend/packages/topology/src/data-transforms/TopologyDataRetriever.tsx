import * as React from 'react';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { usePrometheusRulesPoll } from '@console/internal/components/graphs/prometheus-rules-hook';
import { getAlertsAndRules } from '@console/internal/components/monitoring/utils';
import { TopologyResourcesObject, TrafficData } from '../topology-types';
import { ModelContext, ExtensibleModel } from './ModelContext';
import { getFilterById, SHOW_GROUPS_FILTER_ID, useDisplayFilters } from '../filters';
import { updateTopologyDataModel } from './updateTopologyDataModel';

type TopologyDataRetrieverProps = {
  trafficData?: TrafficData;
};

const TopologyDataRetriever: React.FC<TopologyDataRetrieverProps> = ({ trafficData }) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { namespace } = dataModelContext;
  const filters = useDisplayFilters();
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
  const resourcesList = React.useMemo<WatchK8sResources<any>>(
    () => (namespace && dataModelContext.extensionsLoaded ? dataModelContext.watchedResources : {}),
    [dataModelContext.extensionsLoaded, dataModelContext.watchedResources, namespace],
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
    updateTopologyDataModel(dataModelContext, resources, showGroups, trafficData, monitoringAlerts)
      .then((res) => {
        dataModelContext.loadError = res.loadError;
        if (res.loaded) {
          dataModelContext.loaded = true;
          dataModelContext.model = res.model;
        }
      })
      .catch(() => {});
  }, [resources, trafficData, dataModelContext, monitoringAlerts, showGroups]);

  return null;
};

export default TopologyDataRetriever;
