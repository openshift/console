import { FC, useEffect, useState } from 'react';
import {
  isTopologyDataModelFactory,
  ResolvedExtension,
  TopologyDataModelFactory,
  useResolvedExtensions,
  WatchK8sResourcesGeneric,
} from '@console/dynamic-plugin-sdk';
import DataModelExtension from './DataModelExtension';
import { ModelContext, ExtensibleModel } from './ModelContext';
import TopologyDataRetriever from './TopologyDataRetriever';

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const DataModelProvider: FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = useState<ExtensibleModel>(new ExtensibleModel(namespace));

  useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  // Use useResolvedExtensions to automatically resolve all CodeRefs in the extensions
  const [modelFactories, factoriesResolved] = useResolvedExtensions<TopologyDataModelFactory>(
    isTopologyDataModelFactory,
  );

  // State to track resolved factories (with async resources resolved)
  const [resolvedFactories, setResolvedFactories] = useState<
    | {
        properties: Omit<ResolvedExtension<TopologyDataModelFactory>['properties'], 'resources'> & {
          resources?: WatchK8sResourcesGeneric;
        };
        pluginID: string;
      }[]
    | null
  >(null);

  // Resolve any async resources from factories
  useEffect(() => {
    if (!modelFactories || !factoriesResolved) {
      setResolvedFactories(null);
      return;
    }

    const resolveFactories = async () => {
      const resolved = await Promise.all(
        modelFactories.map(async (factory) => {
          const { resources, ...rest } = factory.properties;

          // Check if resources is a function (CodeRef that returns Promise)
          if (typeof resources === 'function') {
            try {
              const resolvedResources: WatchK8sResourcesGeneric = await resources();
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
          return {
            properties: { ...rest, resources },
            pluginID: factory.pluginID,
          };
        }),
      );

      setResolvedFactories(resolved);
    };

    resolveFactories();
  }, [modelFactories, factoriesResolved]);

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
