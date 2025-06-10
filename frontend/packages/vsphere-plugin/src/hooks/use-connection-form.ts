import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { K8sModel, k8sGet } from '@console/dynamic-plugin-sdk/src/api/core-api';
import { ConnectionFormFormikValues } from '../components/types';
import { decodeBase64, getErrorMessage } from '../components/utils';
import { VSPHERE_CREDS_SECRET_NAME, VSPHERE_CREDS_SECRET_NAMESPACE } from '../constants';
import { Infrastructure, Secret } from '../resources';
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
      isInit: vCenterServer === 'vcenterplaceholder',
    };
  }

  const datacenter = vSphereFailureDomain.topology?.datacenter || '';
  const defaultDatastore = vSphereFailureDomain.topology?.datastore || '';
  const folder = vSphereFailureDomain.topology?.folder || '';
  const vcenter = vSphereCfg.vcenters?.[0]?.server || '';
  const vCenterCluster = vSphereFailureDomain.topology.networks[0] || '';

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
    username = decodeBase64(secretKeyValues[`${vcenter}.username`]);
    password = decodeBase64(secretKeyValues[`${vcenter}.password`]);
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
    vcenter,
    vCenterCluster,
    password,
    username,
  };
};

export const useConnectionForm = () => {
  const { t } = useTranslation('vsphere-plugin');
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<{ title: string; message: string }>();
  const { secretModel, infrastructureModel } = useConnectionModels();
  const [result, setResult] = React.useState<ConnectionFormFormikValues>();

  React.useEffect(() => {
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
