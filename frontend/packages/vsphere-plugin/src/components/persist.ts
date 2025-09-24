import { safeLoad, dump } from 'js-yaml';
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
import { ConnectionFormFormikValues, PersistOp, ProviderCM } from './types';
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

const updateYamlFormat = (
  t: TFunction<'vsphere-plugin'>,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig: ConfigMap,
): string => {
  let cmCfg: ProviderCM;
  try {
    cmCfg = safeLoad(cloudProviderConfig.data.config);
  } catch (e) {
    throw new PersistError(
      t('Failed to parse cloud provider config {{cm}}', { cm: cloudProviderConfig.metadata.name }),
      getErrorMessage(t, e),
    );
  }

  const vceterKeys = Object.keys(cmCfg.vcenter);
  const initKey = initValues.vcenter || vceterKeys[0];
  const origCfg = cmCfg.vcenter[initKey];
  delete cmCfg.vcenter[initKey];
  cmCfg.vcenter = {
    ...cmCfg.vcenter,
    [values.vcenter]: {
      ...origCfg,
      server: values.vcenter,
      datacenters: [values.datacenter],
    },
  };

  return dump(cmCfg);
};

type UpdateConfigMapResult = {
  config: string;
  expectedValues: string[];
};

const getUpdatedConfig = (
  result: UpdateConfigMapResult,
  init: string,
  replacement: string,
): UpdateConfigMapResult | undefined => {
  const cfg = result.config;
  if (!cfg || !cfg.includes(init)) {
    result.expectedValues.push(init);
    return result;
  }

  return {
    config: cfg.replace(init, replacement),
    expectedValues: result.expectedValues,
  };
};

// Updates the configMap folder value if the following conditions are met:
// 1 - The ConfigMap includes the entry for the "folder"
// 2 - The infrastructure CRD either has no "folder" entry, or it has a "folder" entry that matches the "folder" entry in the ConfigMap
const getUpdatedConfigMapFolder = (
  result: UpdateConfigMapResult,
  initFolder: string,
  newFolder: string,
): UpdateConfigMapResult | undefined => {
  const cfg = result.config;
  const folderLineMatch = cfg.match(/folder\s*=\s*["']?([^"'\n\r]+)["']?/);
  if (folderLineMatch) {
    const folderLine = folderLineMatch[0];
    const folderValue = folderLineMatch[1].trim();

    if (!initFolder || initFolder === folderValue) {
      return {
        config: cfg.replace(folderLine, `folder = "${newFolder}"`),
        expectedValues: result.expectedValues,
      };
    }
  }
  return getUpdatedConfig(result, `folder = "${initFolder}"`, `folder = "${newFolder}"`);
};

// Updates the configMap resourcepool-path value if the following conditions are met:
// 1 - The ConfigMap includes the entry for the "resourcepool-path"
// 2 - The existing value for "resourcepool-path" in the ConfigMap starts with the pattern "/${datacenter}/host/${vCenterCluster}/Resources"
// Additionally, the resourcepool-path may contain additional path segments after "/Resources", which will be preserved.
const getUpdatedConfigMapResourcePool = (
  result: UpdateConfigMapResult,
  initDatacenter: string,
  initVCenterCluster: string,
  datacenter: string,
  vCenterCluster: string,
): UpdateConfigMapResult | undefined => {
  const cfg = result.config;

  // Find the starting pattern in the "resourcepool-path" entry in the ConfigMap
  const resourcePoolMatch = cfg.match(/resourcepool-path\s*=\s*["']?([^"'\n\r]+)["']?/);
  if (resourcePoolMatch) {
    const resourcePoolPathLine = resourcePoolMatch[0];
    const resourcePoolPathValue = resourcePoolMatch[1].trim();

    // Check only the starting pattern, to prevent the additional path segments from breaking the exact match comparison
    const poolPathStartingPattern = `/${initDatacenter}/host/${initVCenterCluster}/Resources`;
    if (resourcePoolPathValue.startsWith(poolPathStartingPattern)) {
      // Extract any additional path segments after /Resources to preserve them
      const additionalSegments = resourcePoolPathValue.substring(poolPathStartingPattern.length);
      const newResourcePoolPath = `/${datacenter}/host/${vCenterCluster}/Resources${additionalSegments}`;
      return {
        config: cfg.replace(resourcePoolPathLine, `resourcepool-path = "${newResourcePoolPath}"`),
        expectedValues: result.expectedValues,
      };
    }
  }

  // As a fallback, only exact matches are supported (this would not preserve additional path segments)
  const initResourcePoolPath = `/${initDatacenter}/host/${initVCenterCluster}/Resources`;
  const newResourcePoolPath = `/${datacenter}/host/${vCenterCluster}/Resources`;
  return getUpdatedConfig(
    result,
    `resourcepool-path = "${initResourcePoolPath}"`,
    `resourcepool-path = "${newResourcePoolPath}"`,
  );
};

const updateIniFormat = (
  t: TFunction<'vsphere-plugin'>,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig: ConfigMap,
): string => {
  const cfg = cloudProviderConfig.data.config;

  const initVCenter = initValues.vcenter || 'vcenterplaceholder';
  const initVCenterCluster = initValues.vCenterCluster || 'clusterplaceholder';
  const initDatacenter = initValues.datacenter || 'datacenterplaceholder';
  const initDatastore =
    initValues.defaultDatastore || '/datacenterplaceholder/datastore/defaultdatastoreplaceholder';

  let result: UpdateConfigMapResult = { config: cfg, expectedValues: [] };

  result = getUpdatedConfig(
    result,
    `[VirtualCenter "${initVCenter}"]`,
    `[VirtualCenter "${values.vcenter}"]`,
  );

  result = getUpdatedConfig(result, `server = "${initVCenter}"`, `server = "${values.vcenter}"`);
  result = getUpdatedConfig(
    result,
    `datacenters = "${initDatacenter}"`,
    `datacenters = "${values.datacenter}"`,
  );
  result = getUpdatedConfig(
    result,
    `datacenter = "${initDatacenter}"`,
    `datacenter = "${values.datacenter}"`,
  );
  result = getUpdatedConfig(
    result,
    `default-datastore = "${initDatastore}"`,
    `default-datastore = "${values.defaultDatastore}"`,
  );

  // "folder" is handled differently, as it can be absent from the "topology" section of the Infrastructure CRD.
  result = getUpdatedConfigMapFolder(result, initValues.folder, values.folder);

  // "resourcepool-path" is handled differently, as it can take additional path segments that need to be preserved
  result = getUpdatedConfigMapResourcePool(
    result,
    initDatacenter,
    initVCenterCluster,
    values.datacenter,
    values.vCenterCluster,
  );

  if (result.expectedValues.length > 0) {
    throw new PersistError(
      t('Failed to parse cloud provider config {{cm}}', {
        cm: cloudProviderConfig.metadata.name,
      }),
      t('The following content was expected to be defined in the configMap: {{ expectedValues }}', {
        expectedValues: result.expectedValues.join(', '),
      }),
    );
  }

  return result.config;
};

// https://issues.redhat.com/browse/OCPBUGS-54434
const fixConfigMap = (values: ConnectionFormFormikValues) => {
  const initCfg: ProviderCM = {
    global: {
      user: '',
      password: '',
      server: '',
      port: 0,
      insecureFlag: true,
      datacenters: [],
      soapRoundtripCount: 0,
      caFile: '',
      thumbprint: '',
      secretName: VSPHERE_CREDS_SECRET_NAME,
      secretNamespace: VSPHERE_CREDS_SECRET_NAMESPACE,
      secretsDirectory: '',
      apiDisable: false,
      apiBinding: '',
      ipFamily: [],
    },
    vcenter: {
      [values.vcenter]: {
        user: '',
        password: '',
        tenantref: '',
        server: values.vcenter,
        port: 443,
        insecureFlag: true,
        datacenters: [values.datacenter],
        soapRoundtripCount: 0,
        caFile: '',
        thumbprint: '',
        secretref: '',
        secretName: '',
        secretNamespace: '',
        ipFamily: [],
      },
    },
    labels: {
      zone: '',
      region: '',
    },
  };
  return dump(initCfg);
};

const getPersistProviderConfigMapOp = async (
  t: TFunction<'vsphere-plugin'>,
  configMapModel: K8sModel,
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  cloudProviderConfig: ConfigMap,
): Promise<PersistOp> => {
  let cfg: string;
  if (initValues.isInit && cloudProviderConfig.data?.config?.includes('global:=true')) {
    cfg = fixConfigMap(values);
  } else {
    try {
      cfg = updateYamlFormat(t, values, initValues, cloudProviderConfig);
    } catch (e) {
      cfg = updateIniFormat(t, values, initValues, cloudProviderConfig);
    }
  }

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

// Gets the updated resource pool path for the infrastructure CRD in the format:
// /{datacenter}/host/{vCenterCluster}/Resources/{additionalSegments}
// Additional segments present in the value are respected.
const getInfrastructureResourcePoolPath = (
  values: ConnectionFormFormikValues,
  initValues: ConnectionFormFormikValues,
  originalResourcePool: string,
): string => {
  const initDatacenter = initValues.datacenter || 'datacenterplaceholder';
  const initVCenterCluster = initValues.vCenterCluster || 'clusterplaceholder';
  const expectedResourcePoolPattern = `/${initDatacenter}/host/${initVCenterCluster}/Resources`;

  let newResourcePool = `/${values.datacenter}/host/${values.vCenterCluster}/Resources`;
  if (originalResourcePool && originalResourcePool.startsWith(expectedResourcePoolPattern)) {
    // Preserve additional path segments after /Resources
    const additionalSegments = originalResourcePool.substring(expectedResourcePoolPattern.length);
    newResourcePool = `/${values.datacenter}/host/${values.vCenterCluster}/Resources${additionalSegments}`;
  }
  return newResourcePool;
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

  const vCenterDomainCfg = initValues.vcenter
    ? infrastructure.spec.platformSpec.vsphere.failureDomains.find(
        (f) => f.server === initValues.vcenter,
      )
    : infrastructure.spec.platformSpec.vsphere.failureDomains[0];

  vCenterDomainCfg.server = values.vcenter;
  vCenterDomainCfg.topology.computeCluster = `/${values.datacenter}/host/${values.vCenterCluster}`;
  vCenterDomainCfg.topology.datacenter = values.datacenter;
  vCenterDomainCfg.topology.datastore = values.defaultDatastore;
  if (values.network) {
    vCenterDomainCfg.topology.networks = [values.network];
  }
  vCenterDomainCfg.topology.folder = values.folder;

  vCenterDomainCfg.topology.resourcePool = getInfrastructureResourcePoolPath(
    values,
    initValues,
    vCenterDomainCfg.topology.resourcePool,
  );

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
      getErrorMessage(t, rejectedPromise.reason),
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
