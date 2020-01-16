import * as _ from 'lodash';
import { KebabOption } from '@console/internal/components/utils/kebab';
import { GraphElement, Node } from '@console/topology';
import { TYPE_WORKLOAD } from '../const';
import { addResourceMenu } from '../../../actions/add-resources';
import { TopologyDataObject } from '../topology-types';

const addResourcesMenu = (workload: TopologyDataObject, connectorSource?: Node) => {
  let menuItems = [];
  if (_.isEmpty(workload)) {
    return menuItems;
  }
  const primaryResource = _.get(workload, ['resources', 'obj'], null);
  const connectorSourceObj = connectorSource?.getData()?.resources?.obj || {};
  if (primaryResource) {
    menuItems = addResourceMenu.map((menuItem) =>
      menuItem(primaryResource, false, connectorSourceObj),
    );
  }
  return menuItems;
};

export const graphActions = (elements: GraphElement[], connectorSource?: Node): KebabOption[] => {
  const primaryResource: Node = _.find(elements, {
    type: TYPE_WORKLOAD,
  }) as Node;
  return [...addResourcesMenu(primaryResource.getData(), connectorSource)];
};
