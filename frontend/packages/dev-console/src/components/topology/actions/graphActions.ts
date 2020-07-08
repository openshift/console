import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { getKnativeContextMenuAction } from '@console/knative-plugin/src/topology/knative-topology-utils';
import { addResourceMenu, addResourceMenuWithoutCatalog } from '../../../actions/add-resources';
import { GraphData } from '../topology-types';

export const graphActions = (graphData: GraphData, connectorSource?: Node) => {
  let resourceMenu = connectorSource ? addResourceMenuWithoutCatalog : addResourceMenu;
  resourceMenu = getKnativeContextMenuAction(graphData, resourceMenu, connectorSource);
  return _.reduce(
    resourceMenu,
    (menuItems, menuItem) => {
      const item = menuItem(
        null,
        graphData.namespace,
        false,
        connectorSource?.getData()?.resources?.obj,
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
