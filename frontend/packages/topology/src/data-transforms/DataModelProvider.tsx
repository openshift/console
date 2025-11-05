import * as React from 'react';
import {
  isTopologyDataModelFactory as isDynamicTopologyDataModelFactory,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
  useResolvedExtensions,
} from '@console/dynamic-plugin-sdk';
import DataModelExtension from './DataModelExtension';
import { ModelContext, ExtensibleModel } from './ModelContext';
import TopologyDataRetriever from './TopologyDataRetriever';

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const DataModelProvider: React.FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = React.useState<ExtensibleModel>(new ExtensibleModel(namespace));

  React.useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  // Use useResolvedExtensions to automatically resolve all CodeRefs in the extensions
  const [dynamicModelFactories, dynamicResolved] = useResolvedExtensions<
    DynamicTopologyDataModelFactory
  >(isDynamicTopologyDataModelFactory);

  return (
    <ModelContext.Provider value={model}>
      {namespace && dynamicResolved && (
        <>
          {dynamicModelFactories.map((factory) => (
            <DataModelExtension
              key={factory.properties.id}
              dataModelFactory={factory.properties}
              pluginID={factory.pluginID}
            />
          ))}
        </>
      )}
      {namespace && <TopologyDataRetriever />}
      {children}
    </ModelContext.Provider>
  );
};

export default DataModelProvider;
