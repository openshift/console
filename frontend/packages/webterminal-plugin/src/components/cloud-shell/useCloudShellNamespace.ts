import { useEffect } from 'react';
import { useSafetyFirst } from '@console/dynamic-plugin-sdk/src/app/components/safety-first';
import { getTerminalInstalledNamespace } from './cloud-shell-utils';

const useCloudShellNamespace = (): [string, string] => {
  const [terminalNamespace, setTerminalNamespace] = useSafetyFirst<string>(undefined);
  const [fetchError, setFetchError] = useSafetyFirst<string>(undefined);
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
