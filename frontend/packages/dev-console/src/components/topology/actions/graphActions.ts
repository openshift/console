import * as _ from 'lodash';
import { Node } from '@patternfly/react-topology';
import { getKnativeContextMenuAction } from '@console/knative-plugin/src/topology/create-connector-utils';
import { addResourceMenu, addResourceMenuWithoutCatalog } from '../../../actions/add-resources';
import { MenuOptions } from '../../../utils/add-resources-menu-utils';
import { GraphData } from '../topology-types';
import { getResource } from '../topology-utils';

export const graphActions = (graphData: GraphData, connectorSource?: Node) => {
  let resourceMenu: MenuOptions = connectorSource ? addResourceMenuWithoutCatalog : addResourceMenu;
  resourceMenu = getKnativeContextMenuAction(graphData, resourceMenu, connectorSource);
  return _.reduce(
    resourceMenu,
    (menuItems, menuItem) => {
      let item;
      if (_.isFunction(menuItem)) {
        item = menuItem(
          null,
          graphData.namespace,
          false,
          getResource(connectorSource),
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
