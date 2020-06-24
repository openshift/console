import { safeLoadAll } from 'js-yaml';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { SecretModel } from '@console/internal/models';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { createOverviewItemsForType } from '@console/shared';
import { Model, NodeModel } from '@console/topology';
import { TopologyDataResources } from '../topology-types';
import {
  HELM_GROUP_HEIGHT,
  HELM_GROUP_WIDTH,
  HELM_GROUP_PADDING,
  TYPE_HELM_RELEASE,
  TYPE_HELM_WORKLOAD,
} from './components/const';
import { HelmReleaseResourcesMap } from '../../helm/helm-types';
import { fetchHelmReleases } from '../../helm/helm-utils';
import { getHelmReleaseKey, WORKLOAD_TYPES } from '../topology-utils';
import {
  addToTopologyDataModel,
  createTopologyNodeData,
  getTopologyGroupItems,
  getTopologyNodeItem,
  mergeGroup,
  mergeGroups,
  WorkloadModelProps,
} from '../data-transforms/transform-utils';

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
    return labels?.name?.includes(releaseName) && labels?.version === releaseVersion.toString();
  });

  if (secret) {
    const appGroup = getTopologyGroupItems(secret);
    if (appGroup) {
      mergeGroup(appGroup, returnData);
    }
  }

  const { kind, apiVersion } = SecretModel;
  const helmGroup: NodeModel = {
    id: secret ? secret.metadata.uid : `${TYPE_HELM_RELEASE}:${releaseName}`,
    type: TYPE_HELM_RELEASE,
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

      createOverviewItemsForType(key, resources).forEach((item) => {
        const { obj: deploymentConfig } = item;
        const uid = deploymentConfig?.metadata?.uid;
        if (isHelmReleaseNode(deploymentConfig, helmResourcesMap)) {
          helmResources[key].push(uid);
          const data = createTopologyNodeData(
            item,
            TYPE_HELM_WORKLOAD,
            getImageForIconClass(`icon-openshift`),
          );
          typedDataModel.nodes.push(
            getTopologyNodeItem(deploymentConfig, TYPE_HELM_WORKLOAD, data, WorkloadModelProps),
          );
          const groups = getTopologyHelmReleaseGroupItem(
            deploymentConfig,
            helmResourcesMap,
            secrets,
          );
          mergeGroups(groups, typedDataModel.nodes);
        }
      });
      addToTopologyDataModel(typedDataModel, helmDataModel);
    }
  });

  helmDataModel.nodes.forEach((node) => {
    if (node.type === TYPE_HELM_RELEASE) {
      node.data.groupResources =
        node.children?.map((id) => helmDataModel.nodes.find((n) => id === n.id)?.data) ?? [];
    }
  });

  return helmDataModel;
};

const getHelmReleaseMap = (namespace: string) => {
  return fetchHelmReleases(namespace)
    .then((releases) =>
      releases.reduce((acc, release) => {
        try {
          const manifestResources: K8sResourceKind[] = safeLoadAll(release.manifest);
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
  let helmResourcesMap = null;

  return (namespace: string, resources: TopologyDataResources): Promise<Model> => {
    const count = resources?.secrets?.data?.length ?? 0;
    let retrieveNewReleaseMap = false;
    if (
      namespace !== mapNamespace ||
      (resources.secrets?.loaded && count !== secretCount) ||
      resources.secrets?.loadError
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
