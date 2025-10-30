import * as React from 'react';
import {
  isTopologyDataModelFactory as isDynamicTopologyDataModelFactory,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
  WatchK8sResources,
} from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../extensions/topology';
import DataModelExtension from './DataModelExtension';
import { ModelContext, ExtensibleModel } from './ModelContext';
import TopologyDataRetriever from './TopologyDataRetriever';

/**
 * Converts dynamic model factories (with WatchK8sResourcesGeneric) to the internal plugin format
 * (with resources as a function that takes namespace and returns WatchK8sResources)
 */
export function getNamespacedDynamicModelFactories(
  dynamicFactories: DynamicTopologyDataModelFactory[],
): TopologyDataModelFactory[] {
  return dynamicFactories
    .filter((factory) => factory.properties.resources)
    .map((factory) => ({
      type: 'Topology/DataModelFactory' as const,
      properties: {
        ...factory.properties,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        resources: (_namespace: string): WatchK8sResources<any> => {
          // Dynamic factories use WatchK8sResourcesGeneric which is handled differently
          // This is a compatibility layer for the legacy Firehose-based ApplicationDropdown
          // Dynamic factories are properly handled in DataModelExtension component
          return {};
        },
      },
    }));
}

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const DataModelProvider: React.FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = React.useState<ExtensibleModel>(new ExtensibleModel(namespace));

  React.useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);
  const dynamicModelFactories = useExtensions<DynamicTopologyDataModelFactory>(
    isDynamicTopologyDataModelFactory,
  );

  return (
    <ModelContext.Provider value={model}>
      {namespace && (
        <>
          {[...dynamicModelFactories, ...modelFactories].map((factory) => (
            <DataModelExtension key={factory.properties.id} dataModelFactory={factory.properties} />
          ))}
        </>
      )}
      {namespace && <TopologyDataRetriever />}
      {children}
    </ModelContext.Provider>
  );
};

export default DataModelProvider;
