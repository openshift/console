import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { K8sModel } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import type { ConnectionFormFormikValues } from '../components/types';
import { decodeBase64, getErrorMessage } from '../components/utils';
import { VSPHERE_CREDS_SECRET_NAME, VSPHERE_CREDS_SECRET_NAMESPACE } from '../constants';
import type { Infrastructure, Secret } from '../resources';
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
  secretModel: K8sModel,
  infrastructureModel: K8sModel,
): Promise<ConnectionFormFormikValues> => {
  const infrastructure = await k8sGet<Infrastructure>({
    model: infrastructureModel,
    name: 'cluster',
  });

  const vSphereCfg = infrastructure.spec?.platformSpec?.vsphere;

  const vSphereFailureDomain = vSphereCfg.failureDomains?.[0];

  const vCenterServer = vSphereCfg?.vcenters?.[0]?.server;
  if (!vSphereFailureDomain || vCenterServer === 'vcenterplaceholder') {
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

  const datacenter = vSphereFailureDomain.topology?.datacenter || '';
  const defaultDatastore = vSphereFailureDomain.topology?.datastore || '';
  const folder = vSphereFailureDomain.topology?.folder || '';

  // Extract cluster name from computeCluster path (format: /{datacenter}/host/{cluster})
  const computeCluster = vSphereFailureDomain.topology?.computeCluster || '';
  const vCenterCluster = computeCluster.match(/\/.*?\/host\/(.+)/)?.[1] || '';

  // Load the primary network (first network in the networks array)
  const network = vSphereFailureDomain.topology?.networks?.[0] || '';

  let username = '';
  let password = '';
  try {
    const secret = await k8sGet<Secret>({
      model: secretModel,
      name: VSPHERE_CREDS_SECRET_NAME,
      ns: VSPHERE_CREDS_SECRET_NAMESPACE,
    });

    if (!secret.data) {
      // eslint-disable-next-line no-console
      console.error(`Unexpected structure of the "${VSPHERE_CREDS_SECRET_NAME}" secret`);
    }

    const secretKeyValues = secret.data || {};
    username = decodeBase64(secretKeyValues[`${vCenterServer}.username`]);
    password = decodeBase64(secretKeyValues[`${vCenterServer}.password`]);
  } catch (e) {
    // It should be there if referenced
    // eslint-disable-next-line no-console
    console.error(
      `Failed to load "${VSPHERE_CREDS_SECRET_NAME}" from "${VSPHERE_CREDS_SECRET_NAMESPACE}" secret: `,
      e,
    );
  }

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

export const useConnectionForm = () => {
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
        const loadResult = await initialLoad(secretModel, infrastructureModel);
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
  }, [infrastructureModel, isLoaded, secretModel, t]);

  return {
    initValues: result,
    isLoaded,
    error,
  };
};
