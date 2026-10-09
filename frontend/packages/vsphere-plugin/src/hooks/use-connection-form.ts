import { useState, useEffect } from 'react';
import type { SecretKind } from '@openshift/api-types/dist/kubernetes/latest';
import { useTranslation } from 'react-i18next';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import type { ConnectionFormFormikValues } from '../components/types';
import { decodeBase64, getErrorMessage, parseKeyValue } from '../components/utils';
import { VSPHERE_CREDS_SECRET_NAME, VSPHERE_CREDS_SECRET_NAMESPACE } from '../constants';
import type { ConfigMap } from '../resources/configMap';
import type { Infrastructure } from '../resources/infrastructure';
import { useConnectionModels } from './use-connection-models';

class LoadError extends Error {
  detail: string;

  constructor(title: string, detail: string) {
    super(title);
    this.name = 'LoadError';
    this.detail = detail;
  }
}

const loadCredentials = async (
  secretModel: K8sModel,
  vcenter: string,
): Promise<{ username: string; password: string }> => {
  try {
    const secret = await k8sGet<SecretKind>({
      model: secretModel,
      name: VSPHERE_CREDS_SECRET_NAME,
      ns: VSPHERE_CREDS_SECRET_NAMESPACE,
    });

    if (!secret.data) {
      // eslint-disable-next-line no-console
      console.error(`Unexpected structure of the "${VSPHERE_CREDS_SECRET_NAME}" secret`);
    }

    const secretKeyValues = secret.data || {};
    return {
      username: decodeBase64(secretKeyValues[`${vcenter}.username`]),
      password: decodeBase64(secretKeyValues[`${vcenter}.password`]),
    };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(
      `Failed to load "${VSPHERE_CREDS_SECRET_NAME}" from "${VSPHERE_CREDS_SECRET_NAMESPACE}" secret: `,
      e,
    );
    return { username: '', password: '' };
  }
};

// Fallback for clusters where failureDomains is not populated (e.g. UPI
// or clusters originally installed before 4.13). Parses the INI-format
// cloud-provider-config ConfigMap instead.
const loadFromConfigMap = async (
  secretModel: K8sModel,
  cloudProviderConfig: ConfigMap,
  vCenterServerFromInfra: string,
): Promise<ConnectionFormFormikValues> => {
  const { config } = cloudProviderConfig.data;

  let vcenter = vCenterServerFromInfra || '';
  let datacenter = '';
  let defaultDatastore = '';
  let folder = '';
  let vCenterCluster = '';

  // INI format: [Workspace] server=, datacenter=, default-datastore=, folder=, resourcepool-path=
  const keyValues = parseKeyValue(config);
  if (!vcenter) {
    vcenter = keyValues.server || '';
  }
  datacenter = keyValues.datacenter || '';
  defaultDatastore = keyValues['default-datastore'] || '';
  folder = keyValues.folder || '';

  const resourcePoolPath = keyValues['resourcepool-path'] || '';
  if (resourcePoolPath.length) {
    const paths = resourcePoolPath.split('/');
    if (paths.length > 3) {
      [, , , vCenterCluster] = paths;
    }
  }

  const { username, password } = await loadCredentials(secretModel, vcenter);

  return {
    vcenter,
    datacenter,
    defaultDatastore,
    folder,
    username,
    password,
    vCenterCluster,
    network: '',
  };
};

export const initialLoad = async (
  secretModel: K8sModel,
  infrastructureModel: K8sModel,
  cloudProviderConfig?: ConfigMap,
): Promise<ConnectionFormFormikValues> => {
  const infrastructure = await k8sGet<Infrastructure>({
    model: infrastructureModel,
    name: 'cluster',
  });

  const vSphereCfg = infrastructure.spec?.platformSpec?.vsphere;

  const vSphereFailureDomain = vSphereCfg.failureDomains?.[0];

  const vCenterServer = vSphereCfg?.vcenters?.[0]?.server;
  if (!vSphereFailureDomain || vCenterServer === 'vcenterplaceholder') {
    if (vCenterServer === 'vcenterplaceholder' || !cloudProviderConfig?.data?.config) {
      return {
        datacenter: '',
        defaultDatastore: '',
        folder: '',
        password: '',
        username: '',
        vcenter: '',
        vCenterCluster: '',
        network: '',
        isInit: vCenterServer === 'vcenterplaceholder',
      };
    }

    return loadFromConfigMap(secretModel, cloudProviderConfig, vCenterServer);
  }

  const datacenter = vSphereFailureDomain.topology?.datacenter || '';
  const defaultDatastore = vSphereFailureDomain.topology?.datastore || '';
  const folder = vSphereFailureDomain.topology?.folder || '';

  // Extract cluster name from computeCluster path (format: /{datacenter}/host/{cluster})
  const computeCluster = vSphereFailureDomain.topology?.computeCluster || '';
  const vCenterCluster = computeCluster.match(/\/.*?\/host\/(.+)/)?.[1] || '';

  // Load the primary network (first network in the networks array)
  const network = vSphereFailureDomain.topology?.networks?.[0] || '';

  const { username, password } = await loadCredentials(secretModel, vCenterServer);

  return {
    datacenter,
    defaultDatastore,
    folder,
    vcenter: vCenterServer,
    vCenterCluster,
    network,
    password,
    username,
  };
};

export const useConnectionForm = (cloudProviderConfig?: ConfigMap) => {
  const { t } = useTranslation('vsphere-plugin');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<{ title: string; message: string }>();
  const { secretModel, infrastructureModel } = useConnectionModels();
  const [result, setResult] = useState<ConnectionFormFormikValues>();

  useEffect(() => {
    const doItAsync = async () => {
      if (isLoaded) {
        return;
      }
      try {
        const loadResult = await initialLoad(secretModel, infrastructureModel, cloudProviderConfig);
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
    initValues: result,
    isLoaded,
    error,
  };
};
