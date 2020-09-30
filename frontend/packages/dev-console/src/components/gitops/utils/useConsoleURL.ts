import { useState, useEffect } from 'react';
import { ConfigMapModel } from '@console/internal/models';
import { K8sResourceKind, k8sGet } from '@console/internal/module/k8s';

const useConsoleURL = () => {
  const [consoleURL, setConsoleURL] = useState<string>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<Error>(null);

  useEffect(() => {
    let ignore = false;

    const getConsoleURL = async () => {
      let configMap: K8sResourceKind;
      let error: Error = null;
      try {
        configMap = await k8sGet(
          ConfigMapModel,
          'console-public',
          'openshift-config-managed',
          null,
        );
      } catch (e) {
        error = e;
      }
      if (ignore) return;
      if (configMap) {
        setLoaded(true);
        setConsoleURL(configMap.data?.consoleURL);
      }
      setLoadError(error);
    };

    getConsoleURL();

    return () => {
      ignore = true;
    };
  }, []);

  return [consoleURL, loaded, loadError];
};

export default useConsoleURL;
