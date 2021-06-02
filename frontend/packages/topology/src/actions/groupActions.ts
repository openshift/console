import { Model, Node } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { addGroupResourceMenu } from '@console/dev-console/src/actions/add-resources';
import { MenuOptions } from '@console/dev-console/src/utils/add-resources-menu-utils';
import { asAccessReview } from '@console/internal/components/utils';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { K8sResourceKind, modelFor, referenceFor } from '@console/internal/module/k8s';
import { getKnativeContextMenuAction } from '@console/knative-plugin/src/topology/create-connector-utils';
import { deleteResourceModal } from '@console/shared';
import { ApplicationModel } from '../models';
import { TopologyApplicationObject, GraphData, OdcNodeModel } from '../topology-types';
import { cleanUpWorkload } from '../utils/application-utils';
import { getResource, getTopologyResourceObject } from '../utils/topology-utils';

export const getGroupComponents = (groupId: string, model: Model): TopologyApplicationObject => {
  return _.values(model.nodes).reduce(
    (acc, val) => {
      const dc = (val as OdcNodeModel).resource || getTopologyResourceObject(val.data);
      if (_.get(dc, ['metadata', 'labels', 'app.kubernetes.io/part-of']) === groupId) {
        acc.resources.push(model.nodes.find((n) => n.id === dc.metadata.uid));
      }
      return acc;
    },
    { id: groupId, name: groupId, resources: [] },
  );
};

const cleanUpWorkloadNode = async (workload: OdcNodeModel): Promise<K8sResourceKind[]> => {
  return cleanUpWorkload(workload.resource, workload.data?.isKnativeResource ?? false);
};

const deleteGroup = (application: TopologyApplicationObject) => {
  // accessReview needs a resource but group is not a k8s resource,
  // so currently picking the first resource to do the rbac checks (might change in future)
  const primaryResource = application.resources[0].resource;
  const resourceModel = modelFor(primaryResource.kind)
    ? modelFor(primaryResource.kind)
    : modelFor(referenceFor(primaryResource));
  return {
    // t('topology~Delete Application')
    labelKey: 'topology~Delete Application',
    callback: () => {
      const reqs = [];
      deleteResourceModal({
        blocking: true,
        resourceName: application.name,
        resourceType: ApplicationModel.label,
        onSubmit: () => {
          application.resources.forEach((resource) => {
            reqs.push(cleanUpWorkloadNode(resource));
          });
          return Promise.all(reqs);
        },
      });
    },
    accessReview: asAccessReview(resourceModel, primaryResource, 'delete'),
  };
};

const addResourcesMenu = (
  graphData: GraphData,
  application: TopologyApplicationObject,
  connectorSource?: Node,
) => {
  const primaryResource = application.resources[0].resource;
  const connectorSourceObj = getResource(connectorSource) || {};
  let resourceMenu: MenuOptions = addGroupResourceMenu;
  resourceMenu = getKnativeContextMenuAction(graphData, resourceMenu, connectorSource, true);
  return _.reduce(
    resourceMenu,
    (menuItems, menuItem) => {
      let item;
      if (_.isFunction(menuItem)) {
        item = menuItem(
          primaryResource,
          primaryResource.metadata.namespace,
          true,
          connectorSourceObj,
          graphData.createResourceAccess,
        );
      } else if (_.isObject(menuItem)) {
        item = menuItem;
      }
      if (item) {
        menuItems.push(item);
      }
      return menuItems;
    },
    [],
  );
};

export const groupActions = (
  graphData: GraphData,
  application: TopologyApplicationObject,
  connectorSource?: Node,
): KebabOption[] => {
  const addItems = graphData ? addResourcesMenu(graphData, application, connectorSource) : [];
  return !connectorSource ? [deleteGroup(application), ...addItems] : addItems;
};
