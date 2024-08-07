import * as React from 'react';
import { consoleFetchJSON as coFetchJSON } from '@console/dynamic-plugin-sdk/src/utils/fetch';

export const usePackageManifestCheck = (
  operatorName: string,
  operatorNamespace: string,
): [boolean, boolean, string] => {
  const [pmExists, setPMExists] = React.useState<boolean>(false);
  const [loaded, setLoaded] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
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
  }, [operatorName, operatorNamespace]);

  return [pmExists, loaded, errorMessage];
};
