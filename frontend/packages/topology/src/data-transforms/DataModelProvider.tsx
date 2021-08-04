import * as React from 'react';
import {
  ExtensionHook,
  isTopologyDataModelFactory as isDynamicTopologyDataModelFactory,
  ResolvedExtension,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
  useResolvedExtensions,
  WatchK8sResources,
} from '@console/dynamic-plugin-sdk';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../extensions/topology';
import DataModelExtension from './DataModelExtension';
import { ModelContext, ExtensibleModel } from './ModelContext';
import TopologyDataRetriever from './TopologyDataRetriever';

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const WatchResourcesHookResolver: React.FC<{
  id: string;
  useResources: ExtensionHook<WatchK8sResources<any>>;
  onResolve: (key: string, resources: WatchK8sResources<any>) => void;
}> = ({ id, useResources, onResolve }) => {
  const [resources, loaded] = useResources();
  React.useEffect(() => {
    if (loaded) {
      onResolve(id, resources);
    }
  }, [id, loaded, onResolve, resources]);
  return null;
};

export const DynamicWatchResourcesLoader: React.FC<{
  children: (props: WatchK8sResources<any>, loaded: boolean) => React.ReactNode;
}> = ({ children }) => {
  const [watchResources, setWatchResources] = React.useState<{
    [key: string]: WatchK8sResources<any>;
  }>({});
  const [modelFactories, loaded] = useResolvedExtensions<DynamicTopologyDataModelFactory>(
    isDynamicTopologyDataModelFactory,
  );
  const modelResources = React.useMemo(
    () =>
      modelFactories
        ?.map((m) => ({ id: m.properties.id, resourceHook: m.properties.resources }))
        .filter(({ resourceHook }) => !!resourceHook),
    [modelFactories],
  );

  const onResolve = React.useCallback(
    (key: string, resources: WatchK8sResources<any>) =>
      setWatchResources((prevResources) => ({ ...prevResources, [key]: resources })),
    [],
  );

  const loadedWatchResources = React.useMemo(
    () => Object.values(watchResources).reduce((acc, val) => ({ ...acc, ...val }), {}),
    [watchResources],
  );

  const allResourcesLoaded = React.useMemo(
    () => loaded && Object.keys(modelResources).length === Object.keys(watchResources).length,
    [loaded, modelResources, watchResources],
  );

  return (
    <>
      <>
        {loaded &&
          modelResources.map(({ id, resourceHook }) => (
            <WatchResourcesHookResolver
              id={id}
              key={id}
              useResources={resourceHook}
              onResolve={onResolve}
            />
          ))}
      </>
      {children(loadedWatchResources, allResourcesLoaded)}
    </>
  );
};

const omitResources = (
  factories: ResolvedExtension<DynamicTopologyDataModelFactory>[],
): ResolvedExtension<Omit<DynamicTopologyDataModelFactory, 'resources'>>[] => {
  const otherProperties = factories.map(({ properties, ...ext }) => {
    const { resources, ...other } = properties;
    return { properties: other, ...ext };
  });
  return otherProperties;
};

const DataModelProvider: React.FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = React.useState<ExtensibleModel>(new ExtensibleModel(namespace));

  React.useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  const [modelFactories, modelFactoriesLoaded] = useResolvedExtensions<TopologyDataModelFactory>(
    isTopologyDataModelFactory,
  );
  const [dynamicModelFactories, dynamicFactoriesLoaded] = useResolvedExtensions<
    DynamicTopologyDataModelFactory
  >(isDynamicTopologyDataModelFactory);

  const dataModelFactories = React.useMemo(
    () =>
      modelFactoriesLoaded && dynamicFactoriesLoaded
        ? [...modelFactories, ...omitResources(dynamicModelFactories)]
        : [],
    [modelFactoriesLoaded, dynamicFactoriesLoaded, modelFactories, dynamicModelFactories],
  );

  return (
    <ModelContext.Provider value={model}>
      {namespace && (
        <>
          {dataModelFactories?.map((factory) => (
            <DataModelExtension key={factory.properties.id} dataModelFactory={factory.properties} />
          ))}
        </>
      )}
      {namespace && (
        <DynamicWatchResourcesLoader>
          {(resources) => <TopologyDataRetriever dynamicResources={resources} />}
        </DynamicWatchResourcesLoader>
      )}
      {children}
    </ModelContext.Provider>
  );
};

export default DataModelProvider;
