import * as React from 'react';
import { ContextMenuItem, ContextSubMenuItem, Node, Graph } from '@patternfly/react-topology';
import {
  history,
  KebabItem,
  KebabOption,
  KebabMenuOption,
  kebabOptionsToMenu,
  isKebabSubMenu,
} from '@console/internal/components/utils';
import { isWorkloadRegroupable } from '../../../utils/application-utils';
import { workloadActions } from '../actions/workloadActions';
import { groupActions } from '../actions/groupActions';
import { graphActions } from '../actions/graphActions';
import { TopologyApplicationObject } from '../topology-types';
import { getResource, isOperatorBackedNode } from '../topology-utils';

const onKebabOptionClick = (option: KebabOption) => {
  if (option.callback) {
    option.callback();
  }
  if (option.href) {
    history.push(option.href);
  }
};

export const createMenuItems = (actions: KebabMenuOption[]) =>
  actions.map((option, index) =>
    isKebabSubMenu(option) ? (
      <ContextSubMenuItem label={option.label} key={option.label}>
        {createMenuItems(option.children)}
      </ContextSubMenuItem>
    ) : (
      <ContextMenuItem
        key={index} // eslint-disable-line react/no-array-index-key
        component={<KebabItem option={option} onClick={() => onKebabOptionClick(option)} />}
      />
    ),
  );

export const workloadContextMenu = (element: Node) =>
  createMenuItems(
    kebabOptionsToMenu(
      workloadActions(
        getResource(element),
        isWorkloadRegroupable(element),
        element.getData().resources,
        isOperatorBackedNode(element),
      ),
    ),
  );

export const noRegroupWorkloadContextMenu = (element: Node) =>
  createMenuItems(
    kebabOptionsToMenu(
      workloadActions(getResource(element), false, null, isOperatorBackedNode(element)),
    ),
  );

export const groupContextMenu = (element: Node, connectorSource?: Node) => {
  const applicationData: TopologyApplicationObject = {
    id: element.getId(),
    name: element.getLabel(),
    resources: element.getData().groupResources,
  };

  const graphData = element.getGraph().getData();
  return createMenuItems(
    kebabOptionsToMenu(groupActions(graphData, applicationData, connectorSource)),
  );
};

export const graphContextMenu = (graph: Graph, connectorSource?: Node) =>
  createMenuItems(kebabOptionsToMenu(graphActions(graph.getData(), connectorSource)));
