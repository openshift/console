import * as React from 'react';
import { getTerminalInstalledNamespace } from './cloud-shell-utils';

const useCloudShellNamespace = (): [string, string] => {
  const [terminalNamespace, setTerminalNamespace] = React.useState<string>();
  const [fetchError, setFetchError] = React.useState<string>();
  React.useEffect(() => {
    const fetchNamespace = async () => {
      try {
        if (!terminalNamespace) {
          const namespaceRequest = await getTerminalInstalledNamespace();
          const namespace = await namespaceRequest.text();
          setTerminalNamespace(namespace);
        }
      } catch (e) {
        const errorMessage = await e.response.text();
        setFetchError(errorMessage);
      }
    };
    fetchNamespace();
  }, [terminalNamespace]);

  return [terminalNamespace, fetchError];
};

export default useCloudShellNamespace;
