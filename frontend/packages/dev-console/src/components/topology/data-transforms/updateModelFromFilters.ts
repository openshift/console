import { Model, NodeModel, createAggregateEdges } from '@patternfly/react-topology';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import {
  getFilterById,
  EXPAND_APPLICATION_GROUPS_FILTER_ID,
  DEFAULT_SUPPORTED_FILTER_IDS,
} from '../filters';
import { TYPE_APPLICATION_GROUP, TYPE_AGGREGATE_EDGE } from '../components/const';
import { TopologyApplyDisplayOptions, DisplayFilters } from '../topology-types';

const getApplicationGroupForNode = (node: NodeModel, groups: NodeModel[]): NodeModel => {
  if (node.type === TYPE_APPLICATION_GROUP) {
    return node;
  }
  const group = groups.find((g) => g.group && g.children?.includes(node.id));
  if (!group) {
    return null;
  }
  if (group.type === TYPE_APPLICATION_GROUP) {
    return group;
  }
  return getApplicationGroupForNode(group, groups);
};

export const updateModelFromFilters = (
  model: Model,
  filters: DisplayFilters,
  application: string = ALL_APPLICATIONS_KEY,
  displayFilterers?: TopologyApplyDisplayOptions[],
  onSupportedFiltersChange?: (supportedFilterIds: string[]) => void,
): Model => {
  const dataModel: Model = {
    nodes: [...model.nodes],
    edges: [...model.edges],
  };
  const supportedFilters = [...DEFAULT_SUPPORTED_FILTER_IDS];
  const expandGroups = getFilterById(EXPAND_APPLICATION_GROUPS_FILTER_ID, filters)?.value ?? true;
  let appGroupFound = false;
  dataModel.nodes.forEach((d) => {
    d.visible = true;
    if (displayFilterers) {
      displayFilterers.forEach((displayFilterer) => {
        const appliedFilters = displayFilterer(model, filters);
        supportedFilters.push(...appliedFilters.filter((f) => !supportedFilters.includes(f)));
      });
    }
    if (d.type === TYPE_APPLICATION_GROUP) {
      if (!appGroupFound) {
        appGroupFound = true;
        supportedFilters.push(EXPAND_APPLICATION_GROUPS_FILTER_ID);
      }
      d.collapsed = !expandGroups;
    }
  });

  // Flag any nodes hidden by the application filter
  if (application !== ALL_APPLICATIONS_KEY) {
    dataModel.nodes.forEach((g) => {
      const group = getApplicationGroupForNode(g, dataModel.nodes);
      g.visible = g.visible && group?.label === application;
    });
  }

  // create links from data, only include those which have a valid source and target
  const edges = dataModel.edges.filter(
    (d) =>
      dataModel.nodes.find((n) => n.id === d.source) &&
      dataModel.nodes.find((n) => n.id === d.target),
  );

  // Create any aggregate edges (those create from hidden endpoints)
  dataModel.edges = createAggregateEdges(TYPE_AGGREGATE_EDGE, edges, dataModel.nodes);

  if (onSupportedFiltersChange) {
    onSupportedFiltersChange(supportedFilters);
  }

  return dataModel;
};
