import { FC, useEffect, useState } from 'react';
import {
  isTopologyDataModelFactory,
  ResolvedExtension,
  TopologyDataModelFactory,
  useResolvedExtensions,
  WatchK8sResourcesGeneric,
} from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/shared';
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

  // Use deep comparison to prevent unnecessary re-renders when factory content is the same
  // CRITICAL for performance: modelFactories array reference may change even when content is identical
  const stableModelFactories = useDeepCompareMemoize(modelFactories);

  // State to track resolved factories (with async resources resolved)
  const [resolvedFactories, setResolvedFactories] = useState<
    | {
        properties: ResolvedExtension<TopologyDataModelFactory>['properties'] & {
          resources?: WatchK8sResourcesGeneric;
        };
        pluginID: string;
      }[]
    | null
  >(null);

  // Resolve any async resources from factories
  // Only re-run when stableModelFactories actually changes content
  useEffect(() => {
    if (!stableModelFactories || !factoriesResolved) {
      setResolvedFactories(null);
      return;
    }

    const resolveFactories = async () => {
      const resolved = await Promise.all(
        stableModelFactories.map(async (factory) => {
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
          return factory;
        }),
      );

      setResolvedFactories(resolved);
    };

    resolveFactories();
  }, [stableModelFactories, factoriesResolved]);

  // Memoize resolvedFactories to ensure stable references for children
  const stableResolvedFactories = useDeepCompareMemoize(resolvedFactories);

  return (
    <ModelContext.Provider value={model}>
      {namespace && stableResolvedFactories && (
        <>
          {stableResolvedFactories.map((factory) => (
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
