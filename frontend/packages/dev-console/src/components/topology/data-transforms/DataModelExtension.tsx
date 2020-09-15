import * as React from 'react';
import { useDeepCompareMemoize } from '@console/shared';
import ModelContext, { ExtensibleModel, ModelExtensionContext } from './ModelContext';
import { TopologyDataModelFactory } from '../../../extensions/topology';

interface DataModelExtensionProps {
  dataModelFactory: TopologyDataModelFactory;
}

export const DataModelExtension: React.FC<DataModelExtensionProps> = ({ dataModelFactory }) => {
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const { id, priority, resources } = dataModelFactory.properties;
  const workloadKeys = useDeepCompareMemoize(dataModelFactory.properties.workloadKeys);
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

      const {
        getDataModel,
        isResourceDepicted,
        getDataModelReconciler,
      } = dataModelFactory.properties;

      if (getDataModel) {
        getDataModel()
          .then((getter) => {
            extensionContext.current.dataModelGetter = getter;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelGetter = () => Promise.resolve({});
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelGetter = () => Promise.resolve({});
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (isResourceDepicted) {
        isResourceDepicted()
          .then((depicter) => {
            extensionContext.current.dataModelDepicter = depicter;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelDepicter = () => false;
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelDepicter = () => false;
        dataModelContext.updateExtension(id, extensionContext.current);
      }

      if (getDataModelReconciler) {
        getDataModelReconciler()
          .then((reconciler) => {
            extensionContext.current.dataModelReconciler = reconciler;
            dataModelContext.updateExtension(id, extensionContext.current);
          })
          .catch(() => {
            extensionContext.current.dataModelReconciler = () => {};
            dataModelContext.updateExtension(id, extensionContext.current);
          });
      } else {
        extensionContext.current.dataModelReconciler = () => {};
        dataModelContext.updateExtension(id, extensionContext.current);
      }
    }
  }, [dataModelContext, dataModelFactory.properties, id, priority, resources, workloadKeys]);

  return null;
};
