import { TFunction } from 'i18next';
import {
  k8sCreate,
  k8sGet,
  K8sModel,
  k8sPatch,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import {
  KUBE_CONTROLLER_MANAGER_NAME,
  VSPHERE_CONFIGMAP_NAME,
  VSPHERE_CONFIGMAP_NAMESPACE,
  VSPHERE_CREDS_SECRET_NAME,
  VSPHERE_CREDS_SECRET_NAMESPACE,
} from '../constants';
import { ConfigMap, KubeControllerManager, KubeControllerManagerModel, Secret } from '../resources';
import { ConnectionFormContextValues } from './types';
import { encodeBase64, mergeCloudProviderConfig } from './utils';

const persistSecret = async (
  t: TFunction,
  SecretModel: K8sModel,
  config: ConnectionFormContextValues,
): Promise<string | undefined> => {
  const { vcenter, username, password } = config;

  const usernameB64 = encodeBase64(username);
  const passwordB64 = encodeBase64(password);

  const secretData = {
    [`${vcenter}.username`]: usernameB64,
    [`${vcenter}.password`]: passwordB64,
  };

  try {
    const secret = await k8sGet<Secret>({
      model: SecretModel,
      name: VSPHERE_CREDS_SECRET_NAME,
      ns: VSPHERE_CREDS_SECRET_NAMESPACE,
    });

    // Found - do PATCH
    try {
      await k8sPatch({
        model: SecretModel,
        resource: secret,
        data: [
          {
            op: 'replace',
            path: '/data',
            value: secretData,
          },
        ],
      });
    } catch (e) {
      return t('vsphere-plugin~Failed to patch {{secret}}', { secret: VSPHERE_CREDS_SECRET_NAME });
    }
  } catch (e) {
    // Not found, create one
    const data: Secret = {
      apiVersion: SecretModel.apiVersion, // 'v1',
      kind: SecretModel.kind,
      metadata: {
        name: VSPHERE_CREDS_SECRET_NAME,
        namespace: VSPHERE_CREDS_SECRET_NAMESPACE,
      },
      data: secretData,
    };

    try {
      await k8sCreate({
        model: SecretModel,
        data,
      });
    } catch (e2) {
      return t('vsphere-plugin~Failed to create {{secret}} secret', {
        secret: VSPHERE_CREDS_SECRET_NAME,
      });
    }
  }

  // success
  return undefined;
};

/** oc patch kubecontrollermanager cluster -p='{"spec": {"forceRedeploymentReason": "recovery-'"$( date --rfc-3339=ns )"'"}}' --type=merge */
const patchKubeControllerManager = async (t: TFunction): Promise<string | undefined> => {
  try {
    const cm = await k8sGet<KubeControllerManager>({
      model: KubeControllerManagerModel,
      name: KUBE_CONTROLLER_MANAGER_NAME,
    });

    if (!cm) {
      return t('vsphere-plugin~Failed to load kubecontrollermanager');
    }

    cm.spec = cm.spec || {};
    const date = new Date().toISOString();
    cm.spec.forceRedeploymentReason = `recovery-${date}`;

    await k8sPatch({
      model: KubeControllerManagerModel,
      resource: {
        metadata: {
          name: KUBE_CONTROLLER_MANAGER_NAME,
        },
      },
      data: [
        {
          op: 'replace',
          path: '/spec',
          value: cm.spec,
        },
      ],
    });
  } catch (e) {
    return t('vsphere-plugin~Failed to patch kubecontrollermanager');
  }

  return undefined;
};

const persistProviderConfigMap = async (
  t: TFunction,
  ConfigMapModel: K8sModel,
  config: ConnectionFormContextValues,
  cloudProviderConfig?: ConfigMap,
): Promise<string | undefined> => {
  const { vcenter, datacenter, defaultdatastore, folder } = config;

  if (cloudProviderConfig) {
    const configIniString = mergeCloudProviderConfig(
      cloudProviderConfig.data?.config || '',
      config,
    );

    try {
      await k8sPatch({
        model: ConfigMapModel,
        resource: {
          metadata: {
            name: VSPHERE_CONFIGMAP_NAME,
            namespace: VSPHERE_CONFIGMAP_NAMESPACE,
          },
        },
        data: [
          {
            op: cloudProviderConfig.data ? 'replace' : 'add',
            path: '/data',
            value: { config: configIniString },
          },
        ],
      });
    } catch (e) {
      return t('vsphere-plugin~Failed to patch {{cm}}', { cm: VSPHERE_CONFIGMAP_NAME });
    }
  } else {
    // Not found - create new one

    // Keep following allignment
    const configIni = `[Global]
secret-name = "${VSPHERE_CREDS_SECRET_NAME}"
secret-namespace = "${VSPHERE_CREDS_SECRET_NAMESPACE}"
insecure-flag = "1"

[Workspace]
server = "${vcenter}"
datacenter = "${datacenter}"
default-datastore = "${defaultdatastore}"
folder = "${folder}"

[VirtualCenter "${vcenter}"]
datacenters = "${datacenter}"
`;

    const data: ConfigMap = {
      apiVersion: 'v1',
      kind: 'ConfigMap',
      metadata: {
        name: VSPHERE_CONFIGMAP_NAME,
        namespace: VSPHERE_CONFIGMAP_NAMESPACE,
      },
      data: {
        config: configIni,
      },
    };

    try {
      await k8sCreate({
        model: ConfigMapModel,
        data,
      });
    } catch (e) {
      return t('vsphere-plugin~Failed to create {{cm}} ConfigMap', { cm: VSPHERE_CONFIGMAP_NAME });
    }
  }

  return undefined;
};

export const persist = async (
  t: TFunction,
  {
    SecretModel,
    ConfigMapModel,
  }: {
    SecretModel: K8sModel;
    ConfigMapModel: K8sModel;
  },
  config: ConnectionFormContextValues,
  cloudProviderConfig?: ConfigMap,
): Promise<string | undefined> => {
  // return "undefined" if success
  return (
    (await persistSecret(t, SecretModel, config)) ||
    (await patchKubeControllerManager(t)) ||
    // eslint-disable-next-line no-return-await
    (await persistProviderConfigMap(t, ConfigMapModel, config, cloudProviderConfig))
  );
};
