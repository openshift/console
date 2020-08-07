import { createAggregateEdges, Model, NodeModel } from '@patternfly/react-topology';
import { ALL_APPLICATIONS_KEY } from '@console/shared/src';
import { referenceFor } from '@console/internal/module/k8s';
import {
  DEFAULT_SUPPORTED_FILTER_IDS,
  EXPAND_APPLICATION_GROUPS_FILTER_ID,
  getFilterById,
  isExpanded,
  SHOW_GROUPS_FILTER_ID,
  showKind,
} from '../filters';
import { TYPE_AGGREGATE_EDGE, TYPE_APPLICATION_GROUP } from '../components/const';
import { DisplayFilters, OdcNodeModel, TopologyApplyDisplayOptions } from '../topology-types';
import { getTopologyResourceObject } from '../topology-utils';

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

const getNodeKind = (node: NodeModel) => {
  let { resource } = node as OdcNodeModel;
  if (resource) {
    return referenceFor(resource);
  }
  const kind = (node as OdcNodeModel).resourceKind;
  if (kind) {
    return kind;
  }
  resource = getTopologyResourceObject(node.data);
  if (resource) {
    return referenceFor(resource);
  }

  return null;
};

const isNodeShown = (node: NodeModel, filters: DisplayFilters, allNodes: NodeModel[]): boolean => {
  let shown = showKind(getNodeKind(node), filters);
  if (!shown) {
    const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
    const parentNode = allNodes.find(
      (n) =>
        n.group && showGroups && n.type !== TYPE_APPLICATION_GROUP && n.children?.includes(node.id),
    );
    shown = parentNode && isNodeShown(parentNode, filters, allNodes);
  }
  return shown;
};

export const updateModelFromFilters = (
  model: Model,
  filters: DisplayFilters,
  application: string = ALL_APPLICATIONS_KEY,
  displayFilterers?: TopologyApplyDisplayOptions[],
  onSupportedFiltersChange?: (supportedFilterIds: string[]) => void,
  onSupportedKindsChange?: (supportedFilterIds: { [key: string]: number }) => void,
): Model => {
  const dataModel: Model = {
    nodes: [...model.nodes],
    edges: [...model.edges],
  };
  const supportedFilters = [...DEFAULT_SUPPORTED_FILTER_IDS];
  const supportedKinds = {};
  let appGroupFound = false;
  const expanded = isExpanded(EXPAND_APPLICATION_GROUPS_FILTER_ID, filters);
  const showGroups = getFilterById(SHOW_GROUPS_FILTER_ID, filters)?.value ?? true;
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
      d.collapsed = !expanded;
    }
    const kind = getNodeKind(d);
    if (kind) {
      if (!supportedKinds[kind]) {
        supportedKinds[kind] = 0;
      }
      supportedKinds[kind]++;
    }
  });

  dataModel.nodes = dataModel.nodes.filter((d) => isNodeShown(d, filters, dataModel.nodes));

  dataModel.nodes.forEach((d) => {
    if (d.group && d.children) {
      d.children = d.children.filter((id) => dataModel.nodes.find((n) => n.id === id));
    }
  });

  // Flag any nodes hidden by the application filter
  if (application !== ALL_APPLICATIONS_KEY) {
    dataModel.nodes.forEach((g) => {
      const group = getApplicationGroupForNode(g, dataModel.nodes);
      g.visible = g.visible && group?.label === application;
    });
  }

  if (!showGroups) {
    dataModel.nodes = dataModel.nodes.filter((n) => !n.group);
    dataModel.edges = [];
  }

  // create links from data, only include those which have a valid source and target
  const edges = dataModel.edges.filter(
    (d) =>
      dataModel.nodes.find((n) => n.id === d.source) &&
      dataModel.nodes.find((n) => n.id === d.target),
  );

  // TODO: This works until some extension adds edges they don't want to show
  // edges may have been hidden via the createAggregateEdges call last time.
  // make them visible now so they reappear when the hidden endpoints reappear.
  edges.forEach((edge) => {
    edge.visible = true;
  });

  // Create any aggregate edges (those create from hidden endpoints)
  dataModel.edges = createAggregateEdges(TYPE_AGGREGATE_EDGE, edges, dataModel.nodes);

  if (onSupportedFiltersChange) {
    onSupportedFiltersChange(supportedFilters);
  }

  if (onSupportedKindsChange) {
    onSupportedKindsChange(supportedKinds);
  }

  return dataModel;
};
