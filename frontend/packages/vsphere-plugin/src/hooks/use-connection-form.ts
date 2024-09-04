import * as React from 'react';
import { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import { K8sModel, k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ConnectionFormFormikValues } from '../components/types';
import { decodeBase64, getErrorMessage, parseKeyValue } from '../components/utils';
import { ConfigMap, Infrastructure, Secret } from '../resources';
import { useConnectionModels } from './use-connection-models';

export class LoadError extends Error {
  detail: string;

  constructor(title: string, detail: string) {
    super(title);
    this.name = 'LoadError';
    this.detail = detail;
  }
}

const initialLoad = async (
  t: TFunction,
  secretModel: K8sModel,
  infrastructureModel: K8sModel,
  cloudProviderConfig: ConfigMap,
): Promise<{ values: ConnectionFormFormikValues; mustPatch: boolean }> => {
  const config = cloudProviderConfig.data?.config;
  if (!config) {
    return {
      values: {
        vcenter: '',
        datacenter: '',
        defaultDatastore: '',
        folder: '',
        username: '',
        password: '',
        vCenterCluster: '',
      },
      mustPatch: false,
    };
  }

  const keyValues = parseKeyValue(config);

  const server = keyValues.server || '';
  const datacenter = keyValues.datacenter || '';
  const defaultDatastore = keyValues['default-datastore'] || '';
  const folder = keyValues.folder || '';

  let vCenterCluster = '';
  const resourcePoolPath = keyValues['resourcepool-path'] as string;
  if (resourcePoolPath?.length) {
    const paths = resourcePoolPath.split('/');
    if (paths.length > 3) {
      [, , , vCenterCluster] = paths;
    }
  }
  let username = '';
  let password = '';

  // query Secret
  if (keyValues['secret-name'] && keyValues['secret-namespace']) {
    // parse secret for username and password
    try {
      const secret = await k8sGet<Secret>({
        model: secretModel,
        name: keyValues['secret-name'],
        ns: keyValues['secret-namespace'],
      });

      if (!secret.data) {
        // eslint-disable-next-line no-console
        console.error(`Unexpected structure of the "${keyValues['secret-name']}" secret`);
      }

      const secretKeyValues = secret.data || {};
      username = decodeBase64(secretKeyValues[`${server}.username`]);
      password = decodeBase64(secretKeyValues[`${server}.password`]);
    } catch (e) {
      // It should be there if referenced
      // eslint-disable-next-line no-console
      console.error(
        `Failed to load "${keyValues['secret-name']}" from "${keyValues['secret-namespace']}" secret: `,
        e,
      );
    }
  }

  let mustPatch = false;
  try {
    const infrastructure = await k8sGet<Infrastructure>({
      model: infrastructureModel,
      name: 'cluster',
    });

    const domain = infrastructure?.spec?.platformSpec?.vsphere?.failureDomains?.find(
      (d) => d.server === server,
    );
    if (domain) {
      const computeCluster = domain?.topology?.computeCluster?.split('/');
      let infraVCenterCluster = '';
      if (computeCluster.length > 3) {
        [, , , infraVCenterCluster] = computeCluster;
      }

      if (!vCenterCluster) {
        vCenterCluster = infraVCenterCluster;
      }
      const datacenterDiff = domain.topology.datacenter !== datacenter;
      const datastoreDiff = domain.topology.datastore !== defaultDatastore;
      const vCenterClusterDiff = infraVCenterCluster !== vCenterCluster;
      mustPatch = datacenterDiff || datastoreDiff || vCenterClusterDiff;
    }
  } catch (e) {
    throw new LoadError(t('Failed to fetch infrastructure resource'), getErrorMessage(t, e));
  }

  return {
    values: {
      vcenter: server,
      datacenter,
      defaultDatastore,
      folder,
      username,
      password,
      vCenterCluster,
    },
    mustPatch,
  };
};

export const useConnectionForm = (cloudProviderConfig?: ConfigMap) => {
  const { t } = useTranslation('vsphere-plugin');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<{ title: string; message: string }>();
  const { secretModel, infrastructureModel } = useConnectionModels();
  const [result, setResult] = React.useState<{
    values: ConnectionFormFormikValues;
    mustPatch: boolean;
  }>();

  React.useEffect(() => {
    const doItAsync = async () => {
      if (isLoaded || !cloudProviderConfig) {
        return;
      }
      try {
        const loadResult = await initialLoad(
          t,
          secretModel,
          infrastructureModel,
          cloudProviderConfig,
        );
        setResult(loadResult);
      } catch (e) {
        if (e instanceof LoadError) {
          setError({ title: e.message, message: e.detail });
        } else {
          setError({ title: t('An error occured'), message: getErrorMessage(t, e) });
        }
      }
      setIsLoaded(true);
    };

    doItAsync();
  }, [cloudProviderConfig, infrastructureModel, isLoaded, secretModel, t]);

  return {
    initValues: result?.values,
    isLoaded,
    error,
    mustPatch: result?.mustPatch,
  };
};
