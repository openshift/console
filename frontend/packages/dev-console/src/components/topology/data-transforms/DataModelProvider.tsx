import * as React from 'react';
import { useExtensions } from '@console/plugin-sdk/src';
import ModelContext, { ExtensibleModel } from './ModelContext';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../../../extensions/topology';
import { DataModelExtension } from './DataModelExtension';
import { TopologyDataRetriever } from '../TopologyDataRetriever';

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

  return (
    <ModelContext.Provider value={model}>
      <>
        {modelFactories.map((factory) => (
          <DataModelExtension key={factory.properties.id} dataModelFactory={factory} />
        ))}
      </>
      <TopologyDataRetriever />
      {children}
    </ModelContext.Provider>
  );
};

export default DataModelProvider;
