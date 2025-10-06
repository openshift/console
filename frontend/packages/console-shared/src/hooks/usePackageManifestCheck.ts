import { useState, useEffect } from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';

export const usePackageManifestCheck = (
  operatorName: string,
  operatorNamespace: string,
  enabled: boolean = true,
): [boolean, boolean, string] => {
  const [pmExists, setPMExists] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!enabled) {
      setPMExists(false);
      setLoaded(true);
      setErrorMessage('');
      return;
    }

    const url = `${window.SERVER_FLAGS.basePath}api/check-package-manifest/?name=${operatorName}&namespace=${operatorNamespace}`;
    coFetchJSON(url)
      .then(() => {
        setPMExists(true);
        setLoaded(true);
        setErrorMessage('');
      })
      .catch((err) => {
        setPMExists(false);
        setLoaded(true);
        setErrorMessage(
          `Error loading PackageManifest for ${operatorName} in ${operatorNamespace}: ${err}`,
        );
      });
  }, [operatorName, operatorNamespace, enabled]);

  return [pmExists, loaded, errorMessage];
};
