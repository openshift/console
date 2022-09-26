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
  const [isDirty, setDirty] = React.useState(false);

  const value = React.useMemo(
    (): ConnectionFormContextData => ({
      isDirty,
      setDirty,

      vcenter,
      setVcenter: (v) => {
        setDirty(true);
        setVcenter(v);
      },

      username,
      setUsername: (v) => {
        setDirty(true);
        setUsername(v);
      },

      password,
      setPassword: (v) => {
        setDirty(true);
        setPassword(v);
      },

      datacenter,
      setDatacenter: (v) => {
        setDirty(true);
        setDatacenter(v);
      },

      defaultDatastore,
      setDefaultDatastore: (v) => {
        setDirty(true);
        setDefaultDatastore(v);
      },

      folder,
      setFolder: (v) => {
        setDirty(true);
        setFolder(v);
      },
    }),
    [datacenter, defaultDatastore, folder, isDirty, password, username, vcenter],
  );

  return <ConnectionFormContext.Provider value={value}>{children}</ConnectionFormContext.Provider>;
};

export const useConnectionFormContext = () => {
  const context = React.useContext(ConnectionFormContext);
  if (!context) {
    throw new Error('useConnectionFormContext must be used within ConnectionFormContextProvider.');
  }
  return context;
};
