import {
  k8sCreate,
  k8sGet,
  K8sModel,
  k8sPatch,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { NodeKind } from '@console/internal/module/k8s';
import {
  FAILURE_DOMAIN_NAME,
  KUBE_CONTROLLER_MANAGER_NAME,
  VSPHERE_CONFIGMAP_NAME,
  VSPHERE_CONFIGMAP_NAMESPACE,
  VSPHERE_CREDS_SECRET_NAME,
  VSPHERE_CREDS_SECRET_NAMESPACE,
} from '../constants';
import { ConfigMap, Infrastructure, KubeControllerManager, Secret } from '../resources';
import { ConnectionFormContextValues } from './types';
import { encodeBase64, mergeCloudProviderConfig } from './utils';

const persistSecret = async (
  secretModel: K8sModel,
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
      model: secretModel,
      name: VSPHERE_CREDS_SECRET_NAME,
      ns: VSPHERE_CREDS_SECRET_NAMESPACE,
    });

    // Found - do PATCH
    try {
      await k8sPatch({
        model: secretModel,
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
      return i18next.t('vsphere-plugin~Failed to patch {{secret}}', {
        secret: VSPHERE_CREDS_SECRET_NAME,
      });
    }
  } catch (e) {
    // Not found, create one
    const data: Secret = {
      apiVersion: secretModel.apiVersion, // 'v1',
      kind: secretModel.kind,
      metadata: {
        name: VSPHERE_CREDS_SECRET_NAME,
        namespace: VSPHERE_CREDS_SECRET_NAMESPACE,
      },
      data: secretData,
    };

    try {
      await k8sCreate({
        model: secretModel,
        data,
      });
    } catch (e2) {
      return i18next.t('vsphere-plugin~Failed to create {{secret}} secret', {
        secret: VSPHERE_CREDS_SECRET_NAME,
      });
    }
  }

  // success
  return undefined;
};

/** oc patch kubecontrollermanager cluster -p='{"spec": {"forceRedeploymentReason": "recovery-'"$( date --rfc-3339=ns )"'"}}' --type=merge */
const patchKubeControllerManager = async (
  kubeControllerManagerModel: K8sModel,
): Promise<string | undefined> => {
  try {
    const cm = await k8sGet<KubeControllerManager>({
      model: kubeControllerManagerModel,
      name: KUBE_CONTROLLER_MANAGER_NAME,
    });

    if (!cm) {
      return i18next.t('vsphere-plugin~Failed to load kubecontrollermanager');
    }

    cm.spec = cm.spec || {};
    const date = new Date().toISOString();
    cm.spec.forceRedeploymentReason = `recovery-${date}`;

    await k8sPatch({
      model: kubeControllerManagerModel,
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
    return i18next.t('vsphere-plugin~Failed to patch kubecontrollermanager');
  }

  return undefined;
};

const persistProviderConfigMap = async (
  configMapModel: K8sModel,
  config: ConnectionFormContextValues,
  cloudProviderConfig?: ConfigMap,
): Promise<string | undefined> => {
  const { vcenter, datacenter, defaultDatastore, folder } = config;

  if (cloudProviderConfig) {
    const configIniString = mergeCloudProviderConfig(
      cloudProviderConfig.data?.config || '',
      config,
    );

    try {
      await k8sPatch({
        model: configMapModel,
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
      return i18next.t('vsphere-plugin~Failed to patch {{cm}}', { cm: VSPHERE_CONFIGMAP_NAME });
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
default-datastore = "${defaultDatastore}"
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
        model: configMapModel,
        data,
      });
    } catch (e) {
      return i18next.t('vsphere-plugin~Failed to create {{cm}} ConfigMap', {
        cm: VSPHERE_CONFIGMAP_NAME,
      });
    }
  }

  return undefined;
};

const taintValue = {
  key: 'node.cloudprovider.kubernetes.io/uninitialized',
  value: 'true',
  effect: 'NoSchedule',
};

const addTaints = async (nodesModel: K8sModel) => {
  const nodes = await k8sListResourceItems<NodeKind>({ model: nodesModel, queryParams: {} });
  const patchRequests = [];
  for (const node of nodes) {
    if (!node.spec.taints) {
      patchRequests.push(
        k8sPatch({
          model: nodesModel,
          resource: node,
          data: [
            {
              op: 'add',
              path: `/spec/taints`,
              value: [taintValue],
            },
          ],
        }),
      );
    } else {
      const taintIndex = node.spec.taints.findIndex(
        (taint) => taint.key === 'node.cloudprovider.kubernetes.io/uninitialized',
      );
      if (taintIndex === -1) {
        patchRequests.push(
          k8sPatch({
            model: nodesModel,
            resource: node,
            data: [
              {
                op: 'add',
                path: `/spec/taints/-`,
                value: taintValue,
              },
            ],
          }),
        );
      } else {
        const taint = node.spec.taints[taintIndex];
        if (taint.effect === taintValue.value && taint.key === taintValue.key) {
          // nothing to do
          patchRequests.push(Promise.resolve());
        } else {
          patchRequests.push(
            k8sPatch({
              model: nodesModel,
              resource: node,
              data: [
                {
                  op: 'replace',
                  path: `/spec/taints/${taintIndex}`,
                  value: taintValue,
                },
              ],
            }),
          );
        }
      }
    }
  }
  const results = await Promise.allSettled(patchRequests);
  const rejectedPromise = results.findIndex((r) => r.status === 'rejected');
  if (rejectedPromise !== -1) {
    return i18next.t('vsphere-plugin~Failed to add taint to node {{node}}', {
      node: nodes[rejectedPromise].metadata?.name,
    });
  }
  return undefined;
};

const persistInfrastructure = async (
  infrastructureModel: K8sModel,
  config: ConnectionFormContextValues,
) => {
  const spec: Infrastructure['spec'] = {
    cloudConfig: {
      key: 'config',
      name: VSPHERE_CONFIGMAP_NAME,
    },
    platformSpec: {
      type: 'VSphere',
      vsphere: {
        failureDomains: [
          {
            name: FAILURE_DOMAIN_NAME,
            region: 'generated-region',
            server: config.vcenter,
            topology: {
              computeCluster: `/${config.datacenter}/host/${config.vCenterCluster}`,
              datacenter: config.datacenter,
              datastore: config.defaultDatastore,
              networks: [config.vCenterCluster],
              resourcePool: `/${config.datacenter}/host/${config.vCenterCluster}/Resources`,
            },
            zone: 'generated-zone',
          },
        ],
        nodeNetworking: {
          external: {},
          internal: {},
        },
        vcenters: [
          {
            datacenters: [config.datacenter],
            port: 443,
            server: config.vcenter,
          },
        ],
      },
    },
  };
  try {
    await k8sPatch({
      model: infrastructureModel,
      resource: {
        metadata: {
          name: 'cluster',
        },
      },
      data: [
        {
          op: 'replace',
          path: `/spec`,
          value: spec,
        },
      ],
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
    return i18next.t('vsphere-plugin~Failed to patch infrastructure spec');
  }
  return undefined;
};

export const persist = async (
  {
    secretModel,
    configMapModel,
    kubeControllerManagerModel,
    nodeModel,
    infrastructureModel,
  }: {
    secretModel: K8sModel;
    configMapModel: K8sModel;
    kubeControllerManagerModel: K8sModel;
    nodeModel: K8sModel;
    infrastructureModel: K8sModel;
  },
  config: ConnectionFormContextValues,
  cloudProviderConfig?: ConfigMap,
): Promise<string | undefined> => {
  // return "undefined" if success
  return (
    (await persistSecret(secretModel, config)) ||
    (await patchKubeControllerManager(kubeControllerManagerModel)) ||
    (await persistProviderConfigMap(configMapModel, config, cloudProviderConfig)) ||
    (await addTaints(nodeModel)) ||
    persistInfrastructure(infrastructureModel, config)
  );
};
