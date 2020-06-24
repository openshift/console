import * as _ from 'lodash';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { modelFor, referenceFor } from '@console/internal/module/k8s';
import { Model, Node } from '@console/topology';
import { asAccessReview } from '@console/internal/components/utils';
import { getKnativeContextMenuAction } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { addResourceMenuWithoutCatalog } from '../../../actions/add-resources';
import { TopologyApplicationObject, GraphData } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';
import { deleteResourceModal } from '../../modals';
import { cleanUpWorkload } from '../../../utils/application-utils';

export const getGroupComponents = (groupId: string, model: Model): TopologyApplicationObject => {
  return _.values(model.nodes).reduce(
    (acc, val) => {
      const dc = getTopologyResourceObject(val.data);
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
  const primaryResource = _.get(application.resources[0], ['resources', 'obj']);
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
          application.resources.forEach((workload) => {
            const resource = _.get(workload, ['resources', 'obj']);
            reqs.push(cleanUpWorkload(resource, workload));
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
  const primaryResource = application.resources[0]?.resources?.obj;
  const connectorSourceObj = connectorSource?.getData()?.resources?.obj || {};
  let resourceMenu = addResourceMenuWithoutCatalog;
  resourceMenu = getKnativeContextMenuAction(graphData, resourceMenu, connectorSource);
  return _.reduce(
    resourceMenu,
    (menuItems, menuItem) => {
      const item = menuItem(
        primaryResource,
        application.resources[0]?.resources?.obj.metadata.namespace,
        true,
        connectorSourceObj,
        graphData.createResourceAccess,
      );
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
