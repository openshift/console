import { Model, NodeShape } from '@patternfly/react-topology';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  getKameletSinkAndSourceBindings,
  isOperatorBackedKnResource,
  isOperatorBackedKnSinkService,
} from '@console/knative-plugin/src/topology/knative-topology-utils';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { getDefaultOperatorIcon, getImageForCSVIcon } from '@console/shared/src';
import { TYPE_APPLICATION_GROUP } from '../const';
import { getTopologyNodeItem } from '../data-transforms/transform-utils';
import { OdcNodeModel, TopologyDataResources } from '../topology-types';
import {
  OPERATOR_GROUP_HEIGHT,
  OPERATOR_GROUP_PADDING,
  OPERATOR_GROUP_WIDTH,
  TYPE_OPERATOR_BACKED_SERVICE,
} from './components/const';
import { getOperatorGroupResource } from './operators-data-transformer';

const topLevelParent = (node: OdcNodeModel, model: Model): OdcNodeModel => {
  const parent = model.nodes.find((n) => n.children?.includes(node.id));
  if (parent) {
    return topLevelParent(parent, model);
  }
  return node;
};

const topLevelDataParent = (node: OdcNodeModel, model: Model): OdcNodeModel => {
  const parent = model.nodes
    .filter((g) => g.type !== TYPE_APPLICATION_GROUP)
    .find((n) => n.children?.includes(node.id));
  if (parent) {
    return topLevelParent(parent, model);
  }
  return node;
};

const OBSModelProps = {
  width: OPERATOR_GROUP_WIDTH,
  height: OPERATOR_GROUP_HEIGHT,
  visible: true,
  group: true,
  shape: NodeShape.rect,
  style: {
    padding: OPERATOR_GROUP_PADDING,
  },
};

export const operatorsDataModelReconciler = (
  model: Model,
  resources: TopologyDataResources,
): void => {
  if (!model || !model.nodes) {
    return;
  }
  // const groupDataModel: Model = { nodes: [], edges: [] };
  const installedOperators = resources?.clusterServiceVersions?.data as ClusterServiceVersionKind[];
  if (!installedOperators?.length) {
    return;
  }
  const defaultIcon = getImageForIconClass(`icon-openshift`);
  const { camelSinkKameletBindings } = getKameletSinkAndSourceBindings(resources);
  const obsGroupNodes: OdcNodeModel[] = [];
  installedOperators.forEach((csv) => {
    const crds = csv?.spec?.customresourcedefinitions?.owned ?? [];
    const crdKinds = crds.map((crd) => crd.kind);
    const operatorGroupNodes = model.nodes.reduce((groupNodes, node: OdcNodeModel) => {
      const { resource } = node;
      if (!resource) {
        return groupNodes;
      }

      // Hide operator backed if belong to source
      if (resources && isOperatorBackedKnResource(resource, resources)) {
        return groupNodes;
      }

      // Hide operator backed if belong to sink
      if (resources && isOperatorBackedKnSinkService(resource, camelSinkKameletBindings)) {
        return groupNodes;
      }

      const owner = resource?.metadata?.ownerReferences?.[0];
      if (!owner) {
        return groupNodes;
      }

      const nodeOwnerKind = owner.kind;
      const nodeOwnerId = owner.uid;
      if (nodeOwnerId === csv.metadata.uid || crdKinds.includes(nodeOwnerKind)) {
        const key = resource?.metadata?.ownerReferences?.[0].name;
        if (!groupNodes[key]) {
          groupNodes[key] = [];
        }
        groupNodes[key].push(node);
      }
      return groupNodes;
    }, {});

    Object.keys(operatorGroupNodes).forEach((key) => {
      const operatorNodes = operatorGroupNodes[key];

      const baseNode = operatorNodes[0] as OdcNodeModel;
      const { operatorGroupItem, csvName } = getOperatorGroupResource(baseNode.resource, resources);
      if (operatorGroupItem) {
        const data = {
          id: operatorGroupItem.metadata.uid,
          name: operatorGroupItem.metadata.name,
          type: TYPE_OPERATOR_BACKED_SERVICE,
          resources: {
            obj: operatorGroupItem,
            buildConfigs: [],
            routes: [],
            services: [],
            isOperatorBackedService: true,
          },
          resource: operatorGroupItem,
          groupResources: operatorNodes,
          data: {
            csvName,
            operatorKind: operatorGroupItem.kind,
            builderImage:
              getImageForCSVIcon(operatorGroupItem?.spec?.icon?.[0]) || getDefaultOperatorIcon(),
            apiVersion: operatorGroupItem.apiVersion,
          },
        };
        const csvIcon = operatorGroupItem?.spec?.icon?.[0] || csv?.spec?.icon?.[0];
        const operatorIcon = getImageForCSVIcon(csvIcon) || getDefaultOperatorIcon();

        const children = operatorNodes.reduce((acc, node) => {
          const parent = topLevelParent(node, model);
          const dataParent = topLevelDataParent(node, model);
          if (parent.type === TYPE_APPLICATION_GROUP) {
            parent.children = parent.children.filter((c) => c !== node.id);
            if (!parent.children.includes(operatorGroupItem.metadata.uid)) {
              parent.children.push(operatorGroupItem.metadata.uid);
            }
          }
          if (node.data.data.builderImage === defaultIcon) {
            node.data.data.builderImage = operatorIcon;
          }
          if (!acc.includes(dataParent)) {
            if (!data.groupResources.includes(dataParent)) {
              data.groupResources.push(dataParent);
            }
            acc.push(dataParent.id);
          }
          return acc;
        }, []);

        const obsNode = getTopologyNodeItem(
          operatorGroupItem,
          TYPE_OPERATOR_BACKED_SERVICE,
          data,
          OBSModelProps,
          children,
          'Operator Backed Service',
        );
        obsGroupNodes.push(obsNode);
      }
    });
  });
  model.nodes.push(...obsGroupNodes);
};
