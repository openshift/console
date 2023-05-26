import * as React from 'react';
import { coFetch } from '@console/internal/co-fetch';
import { removeQueryArgument } from '@console/internal/components/utils';
import { useK8sGet } from '@console/internal/components/utils/k8s-get-hook';
import { SecretModel } from '@console/internal/models';
import { SecretKind } from '@console/internal/module/k8s';
import { PIPELINE_NAMESPACE } from '../../pipelines/const';
import { PAC_GH_APP_MANIFEST_API, PAC_SECRET_NAME } from '../const';
import { createPACSecret, updatePACInfo } from '../pac-utils';

export const usePacData = (
  code: string,
): { loaded: boolean; secretData: SecretKind; loadError: Error; isFirstSetup: boolean } => {
  const apiCallProgressRef = React.useRef(false);
  const [loaded, setloaded] = React.useState<boolean>(false);
  const [secretData, setSecretData] = React.useState<SecretKind>();
  const [loadError, setLoadError] = React.useState(null);
  const [isFirstSetup, setIsFirstSetup] = React.useState<boolean>(false);
  const [pacSecretData, pacSecretDataLoaded, pacSecretDataError] = useK8sGet<SecretKind>(
    SecretModel,
    PAC_SECRET_NAME,
    PIPELINE_NAMESPACE,
  );

  React.useEffect(() => {
    let mounted = true;
    const configureGitHubApp = async () => {
      if (code && !apiCallProgressRef.current) {
        apiCallProgressRef.current = true;
        try {
          const response = await coFetch(`${PAC_GH_APP_MANIFEST_API}/${code}/conversions`, {
            method: 'POST',
          });
          const data = await response.json();
          // eslint-disable-next-line @typescript-eslint/naming-convention
          const { name, id, pem, webhook_secret, html_url } = data;
          const secret = await createPACSecret(id.toString(), pem, webhook_secret, name, html_url);
          await updatePACInfo(html_url);
          if (mounted) {
            setSecretData(secret);
            setloaded(true);
            removeQueryArgument('code');
            setIsFirstSetup(true);
            apiCallProgressRef.current = false;
          }
        } catch (err) {
          if (mounted) {
            apiCallProgressRef.current = false;
            removeQueryArgument('code');
            setloaded(true);
            setLoadError(err);
          }
        }
      }
    };
    configureGitHubApp();
    return () => {
      mounted = false;
    };
  }, [code]);

  React.useEffect(() => {
    if (pacSecretDataLoaded && pacSecretData && !pacSecretDataError) {
      setSecretData(pacSecretData);
      setloaded(true);
    } else if (
      pacSecretDataLoaded &&
      pacSecretDataError?.code === 404 &&
      !apiCallProgressRef.current
    ) {
      setloaded(true);
    }
  }, [pacSecretData, pacSecretDataError, pacSecretDataLoaded]);

  return { loaded, secretData, loadError, isFirstSetup };
};
