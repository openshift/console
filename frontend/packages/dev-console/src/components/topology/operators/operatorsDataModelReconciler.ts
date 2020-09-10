import { Model, NodeShape } from '@patternfly/react-topology';
import { getDefaultOperatorIcon, getImageForCSVIcon } from '@console/shared/src';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import { ClusterServiceVersionKind } from '@console/operator-lifecycle-manager/src';
import { isOperatorBackedKnResource } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { OdcNodeModel, TopologyDataResources } from '../topology-types';
import {
  OPERATOR_GROUP_HEIGHT,
  OPERATOR_GROUP_PADDING,
  OPERATOR_GROUP_WIDTH,
  TYPE_OPERATOR_BACKED_SERVICE,
} from './components/const';
import { getTopologyNodeItem } from '../data-transforms';
import { getOperatorGroupResource } from './operators-data-transformer';
import { TYPE_APPLICATION_GROUP } from '../components';

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

  installedOperators.forEach((csv) => {
    const crds = csv?.spec?.customresourcedefinitions?.owned ?? [];
    const crdKinds = crds.map((crd) => crd.kind);
    const operatorNodes = model.nodes.filter((node: OdcNodeModel) => {
      const { resource } = node;

      // Hide operator backed if belong to source
      if (resources && isOperatorBackedKnResource(resource, resources)) {
        return false;
      }

      const owner = resource?.metadata?.ownerReferences?.[0];
      if (!owner) {
        return false;
      }

      const nodeOwnerKind = owner.kind;
      const nodeOwnerId = owner.uid;
      return nodeOwnerId === csv.metadata.uid || crdKinds.includes(nodeOwnerKind);
    });

    if (operatorNodes.length) {
      // TODO: https://issues.redhat.com/browse/ODC-4730
      // Here we should be creating different operator groups based on the ownerReference data from
      // each node, it has the correct UID, kind, and name.

      const baseNode = operatorNodes[0] as OdcNodeModel;
      const operatorGroupItem = getOperatorGroupResource(baseNode.resource, resources);
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
        model.nodes.push(obsNode);
      }
    }
  });
};
