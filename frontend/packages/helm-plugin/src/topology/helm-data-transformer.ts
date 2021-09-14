import { Model, NodeModel } from '@patternfly/react-topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { SecretModel } from '@console/internal/models';
import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { createOverviewItemForType, WORKLOAD_TYPES } from '@console/shared';
import {
  addToTopologyDataModel,
  createTopologyNodeData,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  mergeGroups,
  WorkloadModelProps,
} from '@console/topology/src/data-transforms/transform-utils';
import { OdcNodeModel, TopologyDataResources } from '@console/topology/src/topology-types';
import { HelmReleaseResourcesMap } from '../types/helm-types';
import { fetchHelmReleases, loadHelmManifestResources } from '../utils/helm-utils';
import {
  HELM_GROUP_HEIGHT,
  HELM_GROUP_WIDTH,
  HELM_GROUP_PADDING,
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from './components/const';

const getHelmReleaseKey = (resource) => `${resource.kind}---${resource.metadata.name}`;

export const isHelmReleaseNode = (
  obj: K8sResourceKind,
  helmResourcesMap: HelmReleaseResourcesMap,
): boolean => {
  if (helmResourcesMap) {
    return helmResourcesMap.hasOwnProperty(getHelmReleaseKey(obj));
  }
  return false;
};

export const getTopologyHelmReleaseGroupItem = (
  obj: K8sResourceKind,
  helmResourcesMap: HelmReleaseResourcesMap,
  secrets: K8sResourceKind[],
): NodeModel[] => {
  const resourceKindName = getHelmReleaseKey(obj);
  const helmResources = helmResourcesMap[resourceKindName];
  const releaseName = helmResources?.releaseName;
  const releaseVersion = helmResources?.releaseVersion;
  const releaseNotes = helmResources?.releaseNotes;
  const uid = obj?.metadata?.uid ?? null;
  const returnData = [];

  if (!releaseName) {
    return returnData;
  }

  const secret = secrets.find((nextSecret) => {
    const { labels } = nextSecret.metadata;
    return labels?.name === releaseName && labels?.version === releaseVersion.toString();
  });

  if (secret) {
    const appGroup = getTopologyGroupItems(secret);
    if (appGroup) {
      mergeGroup(appGroup, returnData);
    }
    if (!secret.apiVersion) {
      secret.apiVersion = apiVersionForModel(SecretModel);
    }
    if (!secret.kind) {
      secret.kind = SecretModel.kind;
    }
  }

  const { kind, apiVersion } = SecretModel;
  const helmGroup: OdcNodeModel = {
    id: secret ? secret.metadata.uid : `${TYPE_HELM_RELEASE}:${releaseName}`,
    type: TYPE_HELM_RELEASE,
    resourceKind: 'HelmRelease',
    group: true,
    label: releaseName,
    children: [uid],
    width: HELM_GROUP_WIDTH,
    height: HELM_GROUP_HEIGHT,
    visible: true,
    style: {
      padding: HELM_GROUP_PADDING,
    },
    data: {
      resources: {
        obj: secret ? { ...secret, kind, apiVersion } : null,
        buildConfigs: null,
        services: null,
        routes: null,
      },
      data: {
        chartIcon: helmResources?.chartIcon,
        manifestResources: helmResources?.manifestResources || [],
        releaseNotes,
      },
    },
  };

  returnData.push(helmGroup);

  return returnData;
};

export const getHelmGraphModelFromMap = (
  helmResourcesMap: HelmReleaseResourcesMap,
  resources: TopologyDataResources,
) => {
  const helmDataModel: Model = {
    nodes: [],
    edges: [],
  };

  const helmResources = {};

  const secrets = resources?.secrets?.data ?? [];
  WORKLOAD_TYPES.forEach((key) => {
    helmResources[key] = [];
    if (resources[key]?.data && resources[key].data.length) {
      const typedDataModel: Model = {
        nodes: [],
        edges: [],
      };
      resources[key].data.forEach((resource) => {
        if (isHelmReleaseNode(resource, helmResourcesMap)) {
          const item = createOverviewItemForType(key, resource, resources);
          const uid = resource?.metadata?.uid;
          const helmResourcesData = helmResourcesMap[getHelmReleaseKey(resource)];
          const deploymentsLabels = resource?.metadata?.labels ?? {};
          const nodeIcon =
            getImageForIconClass(`icon-${deploymentsLabels['app.openshift.io/runtime']}`) ||
            getImageForIconClass(`icon-${deploymentsLabels['app.kubernetes.io/name']}`) ||
            helmResourcesData?.chartIcon ||
            getImageForIconClass(`icon-helm`);
          helmResources[key].push(uid);
          const data = createTopologyNodeData(resource, item, TYPE_HELM_WORKLOAD, nodeIcon);
          typedDataModel.nodes.push(
            getTopologyNodeItem(resource, TYPE_HELM_WORKLOAD, data, WorkloadModelProps),
          );
          const groups = getTopologyHelmReleaseGroupItem(resource, helmResourcesMap, secrets);
          mergeGroups(groups, typedDataModel.nodes);
        }
      });
      addToTopologyDataModel(typedDataModel, helmDataModel);
    }
  });

  helmDataModel.nodes.forEach((node) => {
    if (node.type === TYPE_HELM_RELEASE) {
      node.data.groupResources =
        node.children?.map((id) => helmDataModel.nodes.find((n) => id === n.id)) ?? [];
    }
  });

  return helmDataModel;
};

const getHelmReleaseMap = (namespace: string) => {
  return fetchHelmReleases(namespace)
    .then((releases) =>
      releases.reduce((acc, release) => {
        try {
          const manifestResources = loadHelmManifestResources(release);
          manifestResources.forEach((resource) => {
            const resourceKindName = getHelmReleaseKey(resource);
            if (!acc.hasOwnProperty(resourceKindName)) {
              acc[resourceKindName] = {
                releaseName: release.name,
                releaseVersion: release.version,
                chartIcon: release.chart.metadata.icon,
                manifestResources,
                releaseNotes: release.info.notes,
              };
            }
          });
        } catch (e) {
          // eslint-disable-next-line no-console
          console.error(e);
        }
        return acc;
      }, {}),
    )
    .catch(() => ({}));
};

export const getHelmTopologyDataModel = () => {
  let secretCount = -1;
  let mapNamespace = '';
  let helmResourcesMap = {};

  return (namespace: string, resources: TopologyDataResources): Promise<Model> => {
    const helmSecrets =
      resources?.secrets?.data?.filter((s) => s.metadata?.labels?.owner === 'helm') ?? [];
    const helmReleaseCount = Object.keys(helmResourcesMap).reduce((acc, key) => {
      if (!acc.includes(helmResourcesMap[key].releaseName)) {
        acc.push(helmResourcesMap[key].releaseName);
      }
      return acc;
    }, []).length;
    const count = helmSecrets.length;
    let retrieveNewReleaseMap = false;
    if (
      namespace !== mapNamespace ||
      (resources.secrets?.loaded && count !== secretCount) ||
      resources.secrets?.loadError ||
      secretCount !== helmReleaseCount
    ) {
      secretCount = count;
      mapNamespace = namespace;
      if (resources.secrets?.loadError || count === 0) {
        helmResourcesMap = {};
      } else {
        retrieveNewReleaseMap = true;
      }
    }
    if (retrieveNewReleaseMap) {
      return getHelmReleaseMap(namespace).then((map) => {
        helmResourcesMap = map;
        return getHelmGraphModelFromMap(helmResourcesMap, resources);
      });
    }

    return Promise.resolve(getHelmGraphModelFromMap(helmResourcesMap, resources));
  };
};
