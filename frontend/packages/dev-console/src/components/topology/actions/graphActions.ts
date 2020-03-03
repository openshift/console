import * as _ from 'lodash';
import { Node } from '@console/topology';
import { addResourceMenu, addResourceMenuWithoutCatalog } from '../../../actions/add-resources';
import { GraphData } from '../topology-types';

export const graphActions = (graphData: GraphData, connectorSource?: Node) => {
  const resourceMenu = connectorSource ? addResourceMenuWithoutCatalog : addResourceMenu;
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
