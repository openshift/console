import * as React from 'react';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';
import { TopologyDataRetriever, TopologyDataRetrieverProps } from './TopologyDataRetriever';

export type TopologyExtensionLoaderProps = Omit<TopologyDataRetrieverProps, 'resourcesList'>;

export const TopologyExtensionLoader: React.FC<TopologyExtensionLoaderProps> = ({
  render,
  namespace,
  kindsInFlight,
}) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const [resourcesList, setResourcesList] = React.useState<WatchK8sResources<any>>(
    dataModelContext.watchedResources,
  );
  const [loadedState, setLoadedState] = React.useState<ExtensibleModel>(null);

  React.useEffect(() => {
    if (dataModelContext) {
      dataModelContext.onExtensionsLoaded = setLoadedState;
    }
  }, [dataModelContext]);

  React.useEffect(() => {
    if (kindsInFlight || !loadedState?.extensionsLoaded) {
      return;
    }
    setResourcesList(loadedState.watchedResources);
  }, [kindsInFlight, loadedState]);

  return (
    <TopologyDataRetriever
      render={render}
      resourcesList={resourcesList}
      namespace={namespace}
      kindsInFlight={kindsInFlight}
    />
  );
};
