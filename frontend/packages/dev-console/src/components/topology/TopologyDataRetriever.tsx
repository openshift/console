import * as React from 'react';
import {
  useK8sWatchResources,
  WatchK8sResources,
} from '@console/internal/components/utils/k8s-watch-hook';
import { TopologyResourcesObject } from './topology-types';
import { TopologyDataRenderer, TopologyDataRendererProps } from './TopologyDataRenderer';

export type TopologyDataRetrieverProps = Omit<TopologyDataRendererProps, 'resources'> & {
  resourcesList: WatchK8sResources<any>;
};

export const TopologyDataRetriever: React.FC<TopologyDataRetrieverProps> = ({
  render,
  resourcesList,
  namespace,
  kindsInFlight,
  trafficData,
}) => {
  const resources = useK8sWatchResources<TopologyResourcesObject>(resourcesList);

  return (
    <TopologyDataRenderer
      render={render}
      namespace={namespace}
      resources={resources}
      kindsInFlight={kindsInFlight}
      trafficData={trafficData}
    />
  );
};
