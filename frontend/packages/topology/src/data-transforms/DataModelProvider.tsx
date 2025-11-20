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

  // State to track resolved factories (with async resources resolved)
  const [resolvedFactories, setResolvedFactories] = React.useState<
    | {
        properties: any;
        pluginID: string;
      }[]
    | null
  >(null);

  // Resolve any async resources from factories
  React.useEffect(() => {
    if (!dynamicResolved || !dynamicModelFactories) {
      setResolvedFactories(null);
      return;
    }

    const resolveFactories = async () => {
      const resolved = await Promise.all(
        dynamicModelFactories.map(async (factory) => {
          const { resources, ...rest } = factory.properties;

          // Check if resources is a function (CodeRef that returns Promise)
          if (typeof resources === 'function') {
            try {
              const resolvedResources = await resources();
              return {
                properties: { ...rest, resources: resolvedResources },
                pluginID: factory.pluginID,
              };
            } catch (error) {
              // eslint-disable-next-line no-console
              console.error(
                `Failed to resolve resources for topology factory "${factory.properties.id}" from plugin "${factory.pluginID}":`,
                error,
              );
              return {
                properties: { ...rest, resources: undefined },
                pluginID: factory.pluginID,
              };
            }
          }

          // Resources are already static, no resolution needed
          return factory;
        }),
      );

      setResolvedFactories(resolved);
    };

    resolveFactories();
  }, [dynamicModelFactories, dynamicResolved]);

  return (
    <ModelContext.Provider value={model}>
      {namespace && resolvedFactories && (
        <>
          {resolvedFactories.map((factory) => (
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
