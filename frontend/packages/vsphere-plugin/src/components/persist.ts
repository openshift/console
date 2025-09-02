import { TFunction } from 'react-i18next';
import {
  k8sCreate,
  k8sGet,
  K8sModel,
  k8sPatch,
} from '@console/dynamic-plugin-sdk/src/api/core-api';
import { QueryParams } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { NodeKind } from '@console/internal/module/k8s';
import {
  KUBE_CONTROLLER_MANAGER_NAME,
  VSPHERE_CREDS_SECRET_NAME,
  VSPHERE_CREDS_SECRET_NAMESPACE,
} from '../constants';
import { ConfigMap, Infrastructure, KubeControllerManager, Secret } from '../resources';
import { ConnectionFormFormikValues, PersistOp } from './types';
import { encodeBase64, getErrorMessage } from './utils';

export class PersistError extends Error {
  detail: string;

  constructor(title: string, detail: string) {
    super(title);
    this.name = 'PersistError';
    this.detail = detail;
  }
}

const getPersistSecretOp = async (
  secretModel: K8sModel,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
): Promise<PersistOp> => {
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

    delete secret.data[`${initValues.vcenter || 'vcenterplaceholder'}.username`];
    delete secret.data[`${initValues.vcenter || 'vcenterplaceholder'}.password`];

    // Found - do PATCH
    return (queryParams) =>
      k8sPatch({
        model: secretModel,
        resource: secret,
        data: [
          {
            op: 'replace',
            path: '/data',
            value: {
              ...secret.data,
              ...secretData,
            },
          },
        ],
        queryParams,
      });
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

    return (queryParams) =>
      k8sCreate({
        model: secretModel,
        data,
        queryParams,
      });
  }
};

const getPatchKubeControllerManagerOp = async (
  t: TFunction<'vsphere-plugin'>,
  kubeControllerManagerModel: K8sModel,
): Promise<PersistOp> => {
  let cm: KubeControllerManager;
  try {
    cm = await k8sGet<KubeControllerManager>({
      model: kubeControllerManagerModel,
      name: KUBE_CONTROLLER_MANAGER_NAME,
    });
  } catch (e) {
    throw new PersistError(t('Failed to load kubecontrollermanager'), getErrorMessage(t, e));
  }

  cm.spec = cm.spec || {};
  const date = new Date().toISOString();
  cm.spec.forceRedeploymentReason = `recovery-${date}`;

  return (queryParams) =>
    k8sPatch({
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
      queryParams,
    });
};

const findAndReplace = (str: string, init: string, replacement: string): string | undefined => {
  if (!str || !str.includes(init)) {
    return undefined;
  }

  return str.replace(init, replacement);
};

const updateIniFormat = (
  t: TFunction<'vsphere-plugin'>,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig: ConfigMap,
): string => {
  let cfg = cloudProviderConfig.data.config;

  const initVCenter = initValues.vcenter || 'vcenterplaceholder';
  const initVCenterCluster = initValues.vCenterCluster || 'clusterplaceholder';
  const initDatacenter = initValues.datacenter || 'datacenterplaceholder';
  const initDatastore =
    initValues.defaultDatastore || '/datacenterplaceholder/datastore/defaultdatastoreplaceholder';
  const initFolder = initValues.folder || '/datacenterplaceholder/vm/folderplaceholder';

  cfg = findAndReplace(
    cfg,
    `[VirtualCenter "${initVCenter}"]`,
    `[VirtualCenter "${values.vcenter}"]`,
  );

  cfg = findAndReplace(cfg, `server = "${initVCenter}"`, `server = "${values.vcenter}"`);
  cfg = findAndReplace(
    cfg,
    `datacenters = "${initDatacenter}"`,
    `datacenters = "${values.datacenter}"`,
  );
  cfg = findAndReplace(
    cfg,
    `datacenter = "${initDatacenter}"`,
    `datacenter = "${values.datacenter}"`,
  );
  cfg = findAndReplace(
    cfg,
    `default-datastore = "${initDatastore}"`,
    `default-datastore = "${values.defaultDatastore}"`,
  );
  cfg = findAndReplace(cfg, `folder = "${initFolder}"`, `folder = "${values.folder}"`);
  cfg = findAndReplace(
    cfg,
    `resourcepool-path = "/${initDatacenter}/host/${initVCenterCluster}/Resources"`,
    `resourcepool-path = "/${values.datacenter}/host/${values.vCenterCluster}/Resources"`,
  );

  if (!cfg) {
    throw new PersistError(
      t('Failed to parse cloud provider config {{cm}}', { cm: cloudProviderConfig.metadata.name }),
      t('Unknown format'),
    );
  }

  return cfg;
};

const getPersistProviderConfigMapOp = async (
  t: TFunction<'vsphere-plugin'>,
  configMapModel: K8sModel,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig: ConfigMap,
): Promise<PersistOp> => {
  const cfg = updateIniFormat(t, values, initValues, cloudProviderConfig);

  return (queryParams) =>
    k8sPatch({
      model: configMapModel,
      resource: {
        metadata: {
          name: cloudProviderConfig.metadata.name,
          namespace: cloudProviderConfig.metadata.namespace,
        },
      },
      data: [
        {
          op: 'replace',
          path: '/data',
          value: { config: cfg },
        },
      ],
      queryParams,
    });
};

const taintValue = {
  key: 'node.cloudprovider.kubernetes.io/uninitialized',
  value: 'true',
  effect: 'NoSchedule',
};

const getAddTaintsOps = async (nodesModel: K8sModel): Promise<PersistOp[]> => {
  const nodes = await k8sListResourceItems<NodeKind>({ model: nodesModel, queryParams: {} });
  const patchRequests = [];
  for (const node of nodes) {
    if (!node.spec.taints) {
      patchRequests.push((queryParams) =>
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
          queryParams,
        }),
      );
    } else {
      const taintIndex = node.spec.taints.findIndex(
        (taint) => taint.key === 'node.cloudprovider.kubernetes.io/uninitialized',
      );
      if (taintIndex === -1) {
        patchRequests.push((queryParams) =>
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
            queryParams,
          }),
        );
      } else {
        const taint = node.spec.taints[taintIndex];
        if (!(taint.effect === taintValue.value && taint.key === taintValue.key)) {
          patchRequests.push((queryParams) =>
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
              queryParams,
            }),
          );
        }
      }
    }
  }
  return patchRequests;
};

const getInfraFailureDomain = (infrastructure: Infrastructure, vcenter: string) => {
  if (!infrastructure.spec?.platformSpec?.vsphere?.failureDomains?.length) {
    return undefined;
  }
  return vcenter
    ? infrastructure.spec.platformSpec.vsphere.failureDomains.find((f) => f.server === vcenter)
    : infrastructure.spec.platformSpec.vsphere.failureDomains[0];
};

const getPersistInfrastructureOp = async (
  infrastructureModel: K8sModel,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
): Promise<PersistOp> => {
  const infrastructure = await k8sGet<Infrastructure>({
    model: infrastructureModel,
    name: 'cluster',
  });

  const vCenterDomainCfg = getInfraFailureDomain(infrastructure, initValues.vcenter);
  if (!vCenterDomainCfg) {
    return Promise.resolve(() => Promise.resolve());
  }

  vCenterDomainCfg.server = values.vcenter;
  vCenterDomainCfg.topology.computeCluster = `/${values.datacenter}/host/${values.vCenterCluster}`;
  vCenterDomainCfg.topology.datacenter = values.datacenter;
  vCenterDomainCfg.topology.datastore = values.defaultDatastore;
  vCenterDomainCfg.topology.networks = [values.vCenterCluster];
  vCenterDomainCfg.topology.folder = values.folder;
  vCenterDomainCfg.topology.resourcePool = `/${values.datacenter}/host/${values.vCenterCluster}/Resources`;

  const vCenterCfg = initValues.vcenter
    ? infrastructure.spec.platformSpec.vsphere.vcenters.find((c) => c.server === initValues.vcenter)
    : infrastructure.spec.platformSpec.vsphere.vcenters[0];
  vCenterCfg.server = values.vcenter;
  vCenterCfg.datacenters = [values.datacenter];

  return (queryParams) =>
    k8sPatch({
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
          value: infrastructure.spec,
        },
      ],
      queryParams,
    });
};

const runPatches = async ({
  t,
  persistSecret,
  persistKubeControllerManager,
  persistProviderCM,
  persistInfrastructure,
  addTaints,
  queryParams,
}: {
  t: TFunction<'vsphere-plugin'>;
  persistSecret: PersistOp;
  persistKubeControllerManager: PersistOp;
  persistProviderCM: PersistOp;
  persistInfrastructure: PersistOp;
  addTaints: PersistOp[];
  queryParams?: QueryParams;
}) => {
  try {
    await persistSecret(queryParams);
  } catch (e) {
    throw new PersistError(
      t('Failed to persist {{secret}}', {
        secret: VSPHERE_CREDS_SECRET_NAME,
      }),
      getErrorMessage(t, e),
    );
  }

  try {
    await persistKubeControllerManager(queryParams);
  } catch (e) {
    throw new PersistError(t('Failed to patch kubecontrollermanager'), getErrorMessage(t, e));
  }

  try {
    await persistProviderCM(queryParams);
  } catch (e) {
    throw new PersistError(t('Failed to patch cloud provider config'), getErrorMessage(t, e));
  }

  const results = await Promise.allSettled(addTaints.map((op) => op(queryParams)));
  const rejectedPromise = results.find((r) => r.status === 'rejected');
  if (rejectedPromise) {
    throw new PersistError(
      t('Failed to add taint to nodes'),
      getErrorMessage(t, (rejectedPromise as PromiseRejectedResult).reason),
    );
  }

  try {
    await persistInfrastructure(queryParams);
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
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig?: ConfigMap,
): Promise<void> => {
  const persistSecret = await getPersistSecretOp(secretModel, values, initValues);
  const persistKubeControllerManager = await getPatchKubeControllerManagerOp(
    t,
    kubeControllerManagerModel,
  );
  const persistProviderCM = await getPersistProviderConfigMapOp(
    t,
    configMapModel,
    values,
    initValues,
    cloudProviderConfig,
  );
  const addTaints = await getAddTaintsOps(nodeModel);
  const persistInfrastructure = await getPersistInfrastructureOp(
    infrastructureModel,
    values,
    initValues,
  );

  await runPatches({
    t,
    persistSecret,
    persistKubeControllerManager,
    persistProviderCM,
    persistInfrastructure,
    addTaints,
    queryParams: { dryRun: 'All' },
  });

  await runPatches({
    t,
    persistSecret,
    persistKubeControllerManager,
    persistProviderCM,
    persistInfrastructure,
    addTaints,
  });
};
