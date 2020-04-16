import * as React from 'react';
import ModelContext, { ExtensibleModel } from './ModelContext';

interface DataModelProviderProps {
  namespace: string;
  children?: React.ReactNode;
}

const DataModelProvider: React.FC<DataModelProviderProps> = ({ namespace, children }) => {
  const [model, setModel] = React.useState<ExtensibleModel>(new ExtensibleModel(namespace));

  React.useEffect(() => {
    setModel(new ExtensibleModel(namespace));
  }, [namespace]);

  return <ModelContext.Provider value={model}>{children}</ModelContext.Provider>;
};

export default DataModelProvider;
