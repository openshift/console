import * as _ from 'lodash';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { Model, Node } from '@patternfly/react-topology';
import { asAccessReview } from '@console/internal/components/utils';
import { getKnativeContextMenuAction } from '@console/knative-plugin/src/topology/create-connector-utils';
import { addResourceMenuWithoutCatalog } from '../../../actions/add-resources';
import { TopologyApplicationObject, GraphData, OdcNodeModel } from '../topology-types';
import { getResource, getTopologyResourceObject } from '../topology-utils';
import { deleteResourceModal } from '../../modals';
import { cleanUpWorkload } from '../../../utils/application-utils';
import { MenuOptions } from '../../../utils/add-resources-menu-utils';

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

const deleteGroup = (application: TopologyApplicationObject) => {
  // accessReview needs a resource but group is not a k8s resource,
  // so currently picking the first resource to do the rbac checks (might change in future)
  const primaryResource = application.resources[0].resource;
  const resourceModel = modelFor(primaryResource.kind)
    ? modelFor(primaryResource.kind)
    : modelFor(referenceFor(primaryResource));
  return {
    label: 'Delete Application',
    callback: () => {
      const reqs = [];
      deleteResourceModal({
        blocking: true,
        resourceName: application.name,
        resourceType: 'Application',
        onSubmit: () => {
          application.resources.forEach((resource) => {
            reqs.push(cleanUpWorkload(resource));
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
  let resourceMenu: MenuOptions = addResourceMenuWithoutCatalog;
  resourceMenu = getKnativeContextMenuAction(graphData, resourceMenu, connectorSource);
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
  const addItems = addResourcesMenu(graphData, application, connectorSource);
  return !connectorSource ? [deleteGroup(application), ...addItems] : addItems;
};
