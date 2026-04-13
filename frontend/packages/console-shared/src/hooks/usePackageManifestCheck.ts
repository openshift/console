import { useState, useEffect } from 'react';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';

export const usePackageManifestCheck = (
  operatorName: string,
  operatorNamespace: string,
): [boolean, boolean, string] => {
  const [pmExists, setPMExists] = useState<boolean>(false);
  const [loaded, setLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const url = `${window.SERVER_FLAGS.basePath}api/olm/check-package-manifests/?name=${operatorName}&namespace=${operatorNamespace}`;
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
  }, [operatorName, operatorNamespace]);

  return [pmExists, loaded, errorMessage];
};
