import { TFunction } from 'react-i18next';
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
import { ConnectionFormFormikValues } from './types';
import { encodeBase64, getErrorMessage, mergeCloudProviderConfig } from './utils';

export class PersistError extends Error {
  detail: string;

  constructor(title: string, detail: string) {
    super(title);
    this.name = 'PersistError';
    this.detail = detail;
  }
}

const persistSecret = async (
  t: TFunction<'vsphere-plugin'>,
  secretModel: K8sModel,
  values: ConnectionFormFormikValues,
): Promise<void> => {
  const { vcenter, username, password } = values;

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
      throw new PersistError(
        t('Failed to patch {{secret}}', {
          secret: VSPHERE_CREDS_SECRET_NAME,
        }),
        getErrorMessage(t, e),
      );
    }
  } catch (e) {
    // Not found, create one
    const data: Secret = {
      apiVersion: secretModel.apiVersion,
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
      throw new PersistError(
        t('Failed to create {{secret}} secret', {
          secret: VSPHERE_CREDS_SECRET_NAME,
        }),
        getErrorMessage(t, e2),
      );
    }
  }
};

/** oc patch kubecontrollermanager cluster -p='{"spec": {"forceRedeploymentReason": "recovery-'"$( date --rfc-3339=ns )"'"}}' --type=merge */
const patchKubeControllerManager = async (
  t: TFunction<'vsphere-plugin'>,
  kubeControllerManagerModel: K8sModel,
): Promise<void> => {
  try {
    const cm = await k8sGet<KubeControllerManager>({
      model: kubeControllerManagerModel,
      name: KUBE_CONTROLLER_MANAGER_NAME,
    });

    if (!cm) {
      throw new PersistError(t('Failed to load kubecontrollermanager'), t('Not found.'));
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
    throw new PersistError(t('Failed to patch kubecontrollermanager'), getErrorMessage(t, e));
  }
};

const persistProviderConfigMap = async (
  t: TFunction<'vsphere-plugin'>,
  configMapModel: K8sModel,
  values: ConnectionFormFormikValues,
  cloudProviderConfig?: ConfigMap,
): Promise<void> => {
  const { vcenter, datacenter, defaultDatastore, folder, vCenterCluster } = values;

  if (cloudProviderConfig) {
    const configIniString = mergeCloudProviderConfig(
      cloudProviderConfig.data?.config || '',
      values,
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
      throw new PersistError(
        t('Failed to patch {{cm}}', { cm: VSPHERE_CONFIGMAP_NAME }),
        getErrorMessage(t, e),
      );
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
resourcepool-path = "/${datacenter}/host/${vCenterCluster}/Resources"

[VirtualCenter "${vcenter}"]
datacenters = "${datacenter}"
`;

    const data: ConfigMap = {
      apiVersion: configMapModel.apiVersion,
      kind: configMapModel.kind,
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
      throw new PersistError(
        t('Failed to create {{cm}} ConfigMap', {
          cm: VSPHERE_CONFIGMAP_NAME,
        }),
        getErrorMessage(t, e),
      );
    }
  }
};

const taintValue = {
  key: 'node.cloudprovider.kubernetes.io/uninitialized',
  value: 'true',
  effect: 'NoSchedule',
};

const addTaints = async (t: TFunction<'vsphere-plugin'>, nodesModel: K8sModel) => {
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
        if (!(taint.effect === taintValue.value && taint.key === taintValue.key)) {
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
    throw new PersistError(
      t('Failed to add taint to node {{node}}', {
        node: nodes[rejectedPromise].metadata?.name,
      }),
      getErrorMessage(t, (results[rejectedPromise] as PromiseRejectedResult).reason),
    );
  }
};

const persistInfrastructure = async (
  t: TFunction<'vsphere-plugin'>,
  infrastructureModel: K8sModel,
  values: ConnectionFormFormikValues,
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
            server: values.vcenter,
            topology: {
              computeCluster: `/${values.datacenter}/host/${values.vCenterCluster}`,
              datacenter: values.datacenter,
              datastore: values.defaultDatastore,
              networks: [values.vCenterCluster],
              resourcePool: `/${values.datacenter}/host/${values.vCenterCluster}/Resources`,
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
            datacenters: [values.datacenter],
            port: 443,
            server: values.vcenter,
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
    throw new PersistError(t('Failed to patch infrastructure spec'), getErrorMessage(t, e));
  }
};

export const persist = async (
  t: TFunction<'vsphere-plugin'>,
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
  values: ConnectionFormFormikValues,
  cloudProviderConfig?: ConfigMap,
): Promise<void> => {
  await persistSecret(t, secretModel, values);
  await patchKubeControllerManager(t, kubeControllerManagerModel);
  await persistProviderConfigMap(t, configMapModel, values, cloudProviderConfig);
  await addTaints(t, nodeModel);
  await persistInfrastructure(t, infrastructureModel, values);
};
