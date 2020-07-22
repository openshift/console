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

      dataModelFactory.properties
        .getDataModel()
        .then((getter) => {
          extensionContext.current.dataModelGetter = getter;
          dataModelContext.updateExtension(id, extensionContext.current);
        })
        .catch(() => {
          extensionContext.current.dataModelGetter = () => Promise.resolve({});
          dataModelContext.updateExtension(id, extensionContext.current);
        });

      dataModelFactory.properties
        .isResourceDepicted()
        .then((depicter) => {
          extensionContext.current.dataModelDepicter = depicter;
          dataModelContext.updateExtension(id, extensionContext.current);
        })
        .catch(() => {
          extensionContext.current.dataModelDepicter = () => false;
          dataModelContext.updateExtension(id, extensionContext.current);
        });
    }
  }, [dataModelContext, dataModelFactory.properties, id, priority, resources, workloadKeys]);

  return null;
};
