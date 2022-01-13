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
  const internalReference = internalModel && referenceForModel(internalModel);
  return { namespace, kind: internalReference, ...opts };
};

export const getNamespacedDynamicModelFactories = (
  factories: LoadedExtension<DynamicTopologyDataModelFactory>[],
) =>
  factories.map(({ properties, ...ext }) => {
    return {
      ...ext,
      properties: {
        ...properties,
        resources: (namespace: string) =>
          Object.assign(
            {},
            ...Object.entries(properties.resources).map(([k, v]) => ({
              [k]: flattenResource(namespace, v?.model, v?.opts),
            })),
          ),
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
