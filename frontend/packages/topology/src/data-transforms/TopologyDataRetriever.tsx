import * as React from 'react';
import * as _ from 'lodash';
import {
  useK8sWatchResources,
  WatchK8sResources,
  WatchK8sResults,
} from '@console/internal/components/utils/k8s-watch-hook';
import { useDebounceCallback } from '@console/shared';
import { getFilterById, SHOW_GROUPS_FILTER_ID, useDisplayFilters } from '../filters';
import { TopologyResourcesObject, TrafficData } from '../topology-types';
import { ModelContext, ExtensibleModel } from './ModelContext';
import { updateTopologyDataModel } from './updateTopologyDataModel';
import { useMonitoringAlerts } from './useMonitoringAlerts';

type TopologyDataRetrieverProps = {
  trafficData?: TrafficData;
};

const TopologyDataRetriever: React.FC<TopologyDataRetrieverProps> = ({ trafficData }) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { namespace } = dataModelContext;
  const filters = useDisplayFilters();
  const [resources, setResources] = React.useState<WatchK8sResults<TopologyResourcesObject>>();
  const monitoringAlerts = useMonitoringAlerts(namespace);
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
  const resourcesList = React.useMemo<WatchK8sResources<any>>(
    () => (namespace && dataModelContext.extensionsLoaded ? dataModelContext.watchedResources : {}),
    [dataModelContext.extensionsLoaded, dataModelContext.watchedResources, namespace],
  );

  const debouncedUpdateResources = useDebounceCallback(setResources, 250);

  const updatedResources = useK8sWatchResources<TopologyResourcesObject>(resourcesList);
  React.useEffect(() => debouncedUpdateResources(updatedResources), [
    debouncedUpdateResources,
    updatedResources,
  ]);

  // Wipe the current model on a namespace change
  React.useEffect(() => {
    dataModelContext.model = null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace]);

  React.useEffect(() => {
    if (!_.isEmpty(resources)) {
      updateTopologyDataModel(
        dataModelContext,
        resources,
        showGroups,
        trafficData,
        monitoringAlerts,
      )
        .then((res) => {
          dataModelContext.loadError = res.loadError;
          if (res.loaded) {
            dataModelContext.loaded = true;
            dataModelContext.model = res.model;
          }
        })
        .catch(() => {});
    }
  }, [resources, trafficData, dataModelContext, monitoringAlerts, showGroups]);

  return null;
};

export default TopologyDataRetriever;
