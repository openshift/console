import { useEffect, useState } from 'react';
import { getTerminalInstalledNamespace } from './cloud-shell-utils';

const useCloudShellNamespace = (): [string, string] => {
  const [terminalNamespace, setTerminalNamespace] = useState<string>(undefined);
  const [fetchError, setFetchError] = useState<string>(undefined);
  useEffect(() => {
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
  }, [setFetchError, setTerminalNamespace, terminalNamespace]);

  return [terminalNamespace, fetchError];
};

export default useCloudShellNamespace;
