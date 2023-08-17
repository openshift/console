import * as React from 'react';
import {
  ExtensionK8sGroupKindModel,
  isTopologyDataModelFactory as isDynamicTopologyDataModelFactory,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
  WatchK8sResource,
} from '@console/dynamic-plugin-sdk';
import {
  modelForGroupKind,
  referenceForExtensionModel,
  referenceForModel,
} from '@console/internal/module/k8s';
import { LoadedExtension, useExtensions } from '@console/plugin-sdk/src';
import { isTopologyDataModelFactory, TopologyDataModelFactory } from '../extensions/topology';
import DataModelExtension from './DataModelExtension';
import { ModelContext, ExtensibleModel } from './ModelContext';
import TopologyDataRetriever from './TopologyDataRetriever';

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const flattenResource = (
  namespace: string,
  extension: LoadedExtension<DynamicTopologyDataModelFactory>,
  resourceKey: string,
  model?: ExtensionK8sGroupKindModel,
  opts = {} as Partial<WatchK8sResource>,
) => {
  if (!model) {
    return { namespace, ...opts };
  }

  if (model.version) {
    const extensionReference = referenceForExtensionModel(model); // requires model.version
    return { namespace, kind: extensionReference, ...opts };
  }

  // If can't find reference for an extention model, fall back to internal reference
  const internalModel = modelForGroupKind(model.group, model.kind); // Return null for CRDs
  if (!internalModel) {
    // eslint-disable-next-line no-console
    console.warn(
      `Plugin "${extension.pluginID}": Could not find model (CRD) for group "${model.group}" and kind "${model.kind}" to determinate version. Please add a required flag to the extension to suppress this warning. The resource "${resourceKey}" will not be loaded and ignored in the topology view for now:`,
      extension,
      resourceKey,
      model,
      opts,
    );
    return null;
  }
  const internalReference = referenceForModel(internalModel);
  return { namespace, kind: internalReference, ...opts };
};

export const getNamespacedDynamicModelFactories = (
  extensions: LoadedExtension<DynamicTopologyDataModelFactory>[],
) =>
  extensions.map((extension) => {
    return {
      ...extension,
      properties: {
        ...extension.properties,
        resources: (namespace: string) =>
          Object.entries(extension.properties.resources || {}).reduce((acc, [key, resource]) => {
            const flattenedResource = flattenResource(
              namespace,
              extension,
              key,
              resource?.model,
              resource?.opts,
            );
            if (flattenedResource) {
              acc[key] = flattenedResource;
            }
            return acc;
          }, {}),
      },
    };
  });

const DataModelProvider: React.FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = React.useState<ExtensibleModel>(new ExtensibleModel(namespace));

  React.useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  const modelFactories = useExtensions<TopologyDataModelFactory>(isTopologyDataModelFactory);
  const dynamicModelFactories = useExtensions<DynamicTopologyDataModelFactory>(
    isDynamicTopologyDataModelFactory,
  );

  const namespacedDynamicFactories = React.useMemo(
    () => getNamespacedDynamicModelFactories(dynamicModelFactories),
    [dynamicModelFactories],
  );

  return (
    <ModelContext.Provider value={model}>
      {namespace && (
        <>
          {[...namespacedDynamicFactories, ...modelFactories].map((factory) => (
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
