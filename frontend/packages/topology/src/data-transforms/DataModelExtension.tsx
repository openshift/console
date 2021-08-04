import * as React from 'react';
import {
  ResolvedExtension,
  TopologyDataModelFactory as DynamicTopologyDataModelFactory,
  WatchK8sResources,
} from '@console/dynamic-plugin-sdk';
import { useDeepCompareMemoize } from '@console/shared';
import { TopologyDataModelFactory } from '../extensions/topology';
import { ModelContext, ExtensibleModel, ModelExtensionContext } from './ModelContext';

interface DataModelExtensionProps {
  dataModelFactory: ResolvedExtension<
    TopologyDataModelFactory | DynamicTopologyDataModelFactory
  >['properties'];
}

const DataModelExtension: React.FC<DataModelExtensionProps> = ({ dataModelFactory }) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { id, priority } = dataModelFactory;
  const resources = dataModelFactory.resources as (namespace: string) => WatchK8sResources<any>;
  const workloadKeys = useDeepCompareMemoize(dataModelFactory.workloadKeys);
  const extensionContext = React.useRef<ModelExtensionContext>({
    priority,
    workloadKeys,
    resources,
  });

  React.useEffect(() => {
    const storedContext = dataModelContext.getExtension(id);
    if (!storedContext) {
      extensionContext.current = {
        priority,
        workloadKeys,
        resources,
      };
      dataModelContext.updateExtension(id, extensionContext.current);

      const { getDataModel, isResourceDepicted, getDataModelReconciler } = dataModelFactory;
      if (getDataModel) {
        extensionContext.current.dataModelGetter = getDataModel;
        dataModelContext.updateExtension(id, extensionContext.current);
      } else {
        extensionContext.current.dataModelGetter = () => Promise.resolve({});
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (isResourceDepicted) {
        extensionContext.current.dataModelDepicter = isResourceDepicted;
        dataModelContext.updateExtension(id, extensionContext.current);
      } else {
        extensionContext.current.dataModelDepicter = () => false;
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (getDataModelReconciler) {
        extensionContext.current.dataModelReconciler = getDataModelReconciler;
        dataModelContext.updateExtension(id, extensionContext.current);
      } else {
        extensionContext.current.dataModelReconciler = () => {};
        dataModelContext.updateExtension(id, extensionContext.current);
      }
    }
  }, [dataModelContext, dataModelFactory, id, priority, resources, workloadKeys]);

  return null;
};

export default DataModelExtension;
