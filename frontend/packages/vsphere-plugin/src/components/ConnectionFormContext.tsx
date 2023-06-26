import * as React from 'react';
import { ConnectionFormContextData } from './types';

const ConnectionFormContext = React.createContext<ConnectionFormContextData | null>(null);

export const ConnectionFormContextProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [vcenter, setVcenter] = React.useState<string>('');
  const [username, setUsername] = React.useState<string>('');
  const [password, setPassword] = React.useState<string>('');
  const [datacenter, setDatacenter] = React.useState<string>('');
  const [defaultDatastore, setDefaultDatastore] = React.useState<string>('');
  const [folder, setFolder] = React.useState<string>('');
  const [vCenterCluster, setVCenterCluster] = React.useState<string>('');
  const [isDirty, setDirty] = React.useState(false);

  const value = React.useMemo<ConnectionFormContextData>(() => {
    const formFunction = (func: (v: string) => void) => (val: string) => {
      func(val);
      setDirty(true);
    };

    const setters = {
      setVcenter,
      setUsername,
      setPassword,
      setDatacenter,
      setDefaultDatastore,
      setFolder,
      setVCenterCluster,
    };
    const values = {
      vcenter,
      username,
      password,
      datacenter,
      defaultDatastore,
      folder,
      vCenterCluster,
    };

    return {
      values,
      setters: Object.keys(setters).reduce((acc, curr) => {
        acc[curr] = formFunction(setters[curr]);
        return acc;
      }, {} as ConnectionFormContextData['setters']),
      isDirty,
      setDirty,
      isValid: Object.values(values).every((v) => v?.trim()),
    };
  }, [datacenter, defaultDatastore, folder, isDirty, password, username, vcenter, vCenterCluster]);

  return <ConnectionFormContext.Provider value={value}>{children}</ConnectionFormContext.Provider>;
};

export const useConnectionFormContext = () => {
  const context = React.useContext(ConnectionFormContext);
  if (!context) {
    throw new Error('useConnectionFormContext must be used within ConnectionFormContextProvider.');
  }
  return context;
};
