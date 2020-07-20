import * as _ from 'lodash';
import { EdgeModel, Model, NodeModel } from '@patternfly/react-topology';
import {
  apiVersionForReference,
  isGroupVersionKind,
  K8sResourceKind,
  kindForReference,
  referenceFor,
  referenceForModel,
} from '@console/internal/module/k8s';
import { WatchK8sResources } from '@console/internal/components/utils/k8s-watch-hook';
import { ClusterServiceVersionModel } from '@console/operator-lifecycle-manager/src';
import { isKnativeServing } from '@console/shared';
import { getImageForIconClass } from '@console/internal/components/catalog/catalog-item-icon';
import {
  TYPE_EVENT_SOURCE,
  TYPE_KNATIVE_REVISION,
} from '@console/knative-plugin/src/topology/const';
import { edgesFromAnnotations } from '../../../utils/application-utils';
import { tknPipelineAndPipelineRunsWatchResources } from '../../../utils/pipeline-plugin-utils';
import {
  TopologyDataObject,
  TopologyOverviewItem,
  ConnectsToData,
  TopologyDataResources,
  TopologyDataModelDepicted,
  OdcNodeModel,
} from '../topology-types';
import {
  TYPE_APPLICATION_GROUP,
  TYPE_CONNECTS_TO,
  NODE_WIDTH,
  NODE_HEIGHT,
  NODE_PADDING,
  GROUP_WIDTH,
  GROUP_HEIGHT,
  GROUP_PADDING,
} from '../components/const';
import { getRoutesURL, WORKLOAD_TYPES } from '../topology-utils';

export const dataObjectFromModel = (node: OdcNodeModel): TopologyDataObject => {
  return {
    id: node.id,
    name: node.label,
    type: node.type,
    resource: node.resource,
    resources: null,
    data: null,
  };
};

/**
 * Support for different type of logo strings. If no supported icon was found it fallbacks to the defaultIcon param.
 *
 * A remote icon:
 * app.openshift.io/icon=https://static.redhat.com/libs/redhat/brand-assets/2/corp/logo--on-dark--200.png
 *
 * An inline base64 x-icon:
 * app.openshift.io/icon=data:image/x-icon;base64,AAABAAEAEBAAAAAAAABoBQAAFgAAACgAAAAQAAAAIAAAAAEACAAAAAAAAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAaGdnAAIAAADq6uoABAHNAHR0dAACAQYAycjHAAEArwAAAtMAAABUAAAAAQAAABoAAgABAJ2dnQD19fUA0NDSAAAARABjYWEAY2RhAKimpQABAAIAAwBVAPHv7gADAAIAAgLMAAUAGwBRUUUAAAEIAF9gTABhYWIAAADKAGJhYgAAAQAAwMC/AP7+/gDj5OUAwL/CANXV1gAAABwAAQAcAGpqagAAAMsA///8AAEBAQAAAkkAAwEBAP/+/wD5+voA3NzcAHV1dQChpKUAAADUAGZmZgBhYmEAMzI0AAAB4gAAAMwAAQDMAAABAgADAMwAFhV3ANXW1QCtra0AAAC8AAEAvAAAAGkAAADVAAEA1QBhYWUAAQC0AAECAAAAAM0AAwC0AP///gADAM0AAAHbAAAArAAAAAYAAAByAAAA3gAAAL0AAADWAEtLOQACANYAAQHLAAAAzgABAZEA/f//AAIAzgD+//8A////AAAAxgADAkwAdHZ1AHV2dQABAIwAdnZ1AAABFQAAAskA/f39AJiWlgBpaWkAAQBjAAAAzwAEAcwAWlpaAFRRQgACAEIAn52TAAAC0gDd3d0AAQDgAHZ2dgAAAdUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW1tbW2RbW1tbW1tbW1tbW1sjZltbI1tbW1tbW1tbW1tbbyMsMVsDD1tYW1tYSkovFD9bKQJHAAckMytlF1hKNxtTHWsAIQAlcQILNVttLUlcOio6QAwhEx4LGCE9WVVLVjo5BFU0GjYSC2JSOSoqUVc5PFU6H2dFYQI4Y2hCCwBIVQQqQUYAASYCbnIRXU1MPDkqQwIALiJaAA0LClBECVUqSwgNAAAwWw4sAChPT2BpVFJsAAAFW1tbNSwVVENwNBYZOwBqZFtbZFsOABxOBgsnAgAyW1tbW1tbW0o+XiA2XxBKW1tbWwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=
 *
 * An inline base64 png:
 * app.openshift.io/icon=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMgAAAAwCAYAAABUmTXqAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA0xpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNi1jMTQwIDc5LjE2MDQ1MSwgMjAxNy8wNS8wNi0wMTowODoyMSAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6M0M2MjQ3OTI2NTNEMTFFOTg5MzE4MTA4NUYyRUZFMjkiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6M0M2MjQ3OTE2NTNEMTFFOTg5MzE4MTA4NUYyRUZFMjkiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTggKE1hY2ludG9zaCkiPiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MDFjYWMxLWZhZTktZjY0Mi1hYTdlLTMzNTJkY2UyODZlNSIgc3RSZWY6ZG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOmY3MDFjYWMxLWZhZTktZjY0Mi1hYTdlLTMzNTJkY2UyODZlNSIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0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
 *
 * An inline base64 svg:
 * app.openshift.io/icon=data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMjUwMCIgaGVpZ2h0PSIyMzE0IiB2aWV3Qm94PSIwIDAgMjU2IDIzNyIgcHJlc2VydmVBc3BlY3RSYXRpbz0ieE1pZFlNaWQiPjxwYXRoIGQ9Ik03NC44NCAxMDYuODkzbC00MC44NjkgMTQuODdjLjUyNSA2LjU1MiAxLjY1MiAxMy4wMjQgMy4yNCAxOS4zNjZsMzguODE4LTE0LjEzN2MtMS4yNDQtNi41NTItMS42ODktMTMuMzItMS4xOC0yMC4xTTI1NS40NDQgNjEuNzAyYy0yLjg1LTUuODc5LTYuMTQ3LTExLjU2MS05Ljk2Ni0xNi45MTZsLTQwLjg1NyAxNC44N2M0Ljc1NSA0Ljg2NCA4Ljc0MyAxMC4zMyAxMi4wMDcgMTYuMTc2TDI1NS40NDUgNjEuN3YuMDAyeiIgZmlsbD0iI0RBMjQzMCIvPjxwYXRoIGQ9Ik0xODIuOTUgNjEuNDYxYy01LjE0LTQuNDYtMTAuOTQ2LTguMzEtMTcuNDA4LTExLjMyNGgtLjAwM0MxMjcuNiAzMi40NDkgODIuMzMgNDguOTA1IDY0LjY0MiA4Ni44NTlhNzMuOTc2IDczLjk3NiAwIDAgMC0yLjY1MyA2LjQ4N2MtMi4yMDggNi40MjMtMy40OTggMTIuOTktMy45OTEgMTkuNTQ2bC0uMTQ0LjA1NC0uMDExLjE0NC0yNC41OTYgOC45NS0xNS44MjYgNS44NDktLjAwNy0uMDg4LS40MzQuMTU4Yy0xLjUzNi0xOS40MzUgMS43NC0zOS41MTIgMTAuNTUzLTU4LjQxMWExMTcuOTUyIDExNy45NTIgMCAwIDEgMy42ODctNy4yNDZjMjkuMDU0LTU0LjExNiA5NS4xNjQtNzYuNzM2IDE1MC45MTgtNTAuMzNhMTE1LjMxNCAxMTUuMzE0IDAgMCAxIDMwLjU1NyAyMS4wNzQgMTE2LjU5NyAxMTYuNTk3IDAgMCAxIDE1Ljc4IDE3Ljk0TDE4Ny42MTggNjUuODZhNzkuNjkgNzkuNjkgMCAwIDAtLjYzNS0uNjQxbC0uMTEzLjA0MWE3OC42MSA3OC42MSAwIDAgMC0zLjkxOS0zLjc5OHoiIGZpbGw9IiNEQTI0MzAiLz48cGF0aCBkPSJNMTkuMjYxIDE5My44OTZsLS4wNjQuMDI0QTExOC40MDQgMTE4LjQwNCAwIDAgMSAuOTM5IDE1NC4zNDdsMzguODI1LTE0LjE0LjAwMi4wMDMuMDI0LjEyNS4yNTItLjA5My4wMDYuMDE1YzEuOTk0IDEwLjU2IDYuMTQ1IDIwLjYzNSAxMi4xOTggMjkuNDk0YTc1LjI4NyA3NS4yODcgMCAwIDAgNy43MjIgOS4zMjZsLS4xNTQuMDU3LjI5NC4zMDgtNDAuNDg4IDE0Ljk3Yy0uMTItLjE3MS0uMjQtLjM0My0uMzU5LS41MTZ6IiBmaWxsPSIjRTgyNDI5Ii8+PHBhdGggZD0iTTE3My40NjUgMTgzLjQ0N2MtMjEuMDUxIDEzLjAxNy00OC4wNTMgMTUuNTMyLTcyLjExMyA0LjMxMmE3NS4xMzkgNzUuMTM5IDAgMCAxLTIyLjExOC0xNS42OTVsLTQwLjc3MiAxNC44NDQuMzEzLjQzNy0uMDIuMDA4YzExLjIxIDE2LjAxNiAyNi41MDIgMjkuNDA0IDQ1LjI2NiAzOC4yOTggNDAuNDcgMTkuMTYzIDg2LjM4NyAxMi41MDEgMTE5LjYzNC0xMy4yODQgMTQuODg4LTExLjE1MiAyNy4zMTctMjYuMDE2IDM1LjcxMy00NC4wMiA4LjgxOS0xOC44OTUgMTIuMDc2LTM4Ljk2NCAxMC41MTUtNTguMzg0bC0xLjEzNi40MTRjLS4wMTUtLjIwOC0uMDMtLjQxNi0uMDQ3LS42MjRsLTQwLjQ5IDE0Ljk1Ny4wMDIuMDA0YTc2LjQ1NyA3Ni40NTcgMCAwIDEtNi44MDYgMjYuNDZjLTYuMzE1IDEzLjc1My0xNi4xNjQgMjQuNzA4LTI3Ljk0IDMyLjI3M3oiIGZpbGw9IiNEQTI0MzAiLz48cGF0aCBkPSJNMjE4LjU1MiA3NS4xM2wuNjA3LS4yMjJ2LS4wMDFhMTE3LjczMiAxMTcuNzMyIDAgMCAxIDExLjQ1NCA0Mi4wNTVsLTQwLjc3MyAxNC44MzQuMDIyLS4zMDQtLjc3LjI4NWMxLjExLTE1LjA4OC0yLjI3NS0zMC4wOTMtOS40MzUtNDMuMTIzbDM4LjU0OC0xNC4yNS4wMDItLjAwNGMuMTE2LjI0My4yMzEuNDg2LjM0NS43M3oiIGZpbGw9IiNFODI0MjkiLz48cGF0aCBkPSJNNzQuODkgMTA2LjY1NEwzNC4zMSAxMjEuNjVjLjUyIDYuNjEgMS42NCAxMy4xMzYgMy4yMTkgMTkuNTMybDM4LjU0Ni0xNC4yNThjLTEuMjQ3LTYuNjIyLTEuNjk1LTEzLjQzOC0xLjE2OS0yMC4yNzRNMjU0LjIyNyA2MS4wODNjLTIuODMtNS45MjktNi4xMDYtMTEuNjU4LTkuODk4LTE3LjA1OUwyMDMuNzYgNTkuMDJjNC43MiA0LjkwNiA4LjY4IDEwLjQxOCAxMS45MiAxNi4zMTVsMzguNTQyLTE0LjI1Ni4wMDYuMDA0eiIgZmlsbD0iI0MyMjAzNSIvPjxwYXRoIGQ9Ik0zNC4zMDggMTIxLjY1M2w0MC40ODItMTQuODI5LS4xNjUgOC4xMzMtMzkuMDU2IDE0Ljc0OS0xLjI2Ni04LjA2My4wMDUuMDF6TTIwMy43NjYgNTguODk3bDQxLjExMy0xNC4xMDggNC4yNzMgNi40NDktMzkuOTQ2IDE0LjEyMS01LjQzNC02LjQ2NS0uMDA2LjAwM3oiIGZpbGw9IiNBQzIyM0IiLz48cGF0aCBkPSJNMzguNzY0IDE4Ny4yMDFsNDAuNTMtMTQuNzQ5IDEyLjI1OCAxMS41NjUtNDIuNTAzIDE1Ljk1Ni0xMC4yODMtMTIuNzc2LS4wMDIuMDA0ek0yNDkuMzggMTA5Ljg2MmwtNDEuMTY1IDE0Ljg0NC0zLjAzMiAxNi40NzggNDMuODkyLTE1LjY0My4zMTEtMTUuNjc3LS4wMDUtLjAwMnoiIGZpbGw9IiNCOTIxMzUiLz4KCTxtZXRhZGF0YT4KCQk8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiIHhtbG5zOnJkZnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDEvcmRmLXNjaGVtYSMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyI+CgkJCTxyZGY6RGVzY3JpcHRpb24gYWJvdXQ9Imh0dHBzOi8vaWNvbnNjb3V0LmNvbS9sZWdhbCNsaWNlbnNlcyIgZGM6dGl0bGU9Im9wZW5zaGlmdC1jb21wYW55LWJyYW5kLWxvZ28iIGRjOmRlc2NyaXB0aW9uPSJvcGVuc2hpZnQtY29tcGFueS1icmFuZC1sb2dvIiBkYzpwdWJsaXNoZXI9Ikljb25zY291dCIgZGM6ZGF0ZT0iMjAxNy0wNy0xMiIgZGM6Zm9ybWF0PSJpbWFnZS9zdmcreG1sIiBkYzpsYW5ndWFnZT0iZW4iPgoJCQkJPGRjOmNyZWF0b3I+CgkJCQkJPHJkZjpCYWc+CgkJCQkJCTxyZGY6bGk+SWNvbiBNYWZpYTwvcmRmOmxpPgoJCQkJCTwvcmRmOkJhZz4KCQkJCTwvZGM6Y3JlYXRvcj4KCQkJPC9yZGY6RGVzY3JpcHRpb24+CgkJPC9yZGY6UkRGPgogICAgPC9tZXRhZGF0YT48L3N2Zz4K
 *
 * "Well known" icons from the labels app.openshift.io/icon app.openshift.io/runtime app.kubernetes.io/name
 * based on the image list in public/components/catalog/catalog-item-icon.tsx
 */
const getIcon = (resource: K8sResourceKind, defaultIcon: string): string => {
  const labels = _.get(resource, 'metadata.labels', {});

  const iconURL = labels['app.openshift.io/icon'];
  if (
    iconURL &&
    (iconURL.startsWith('http:') || iconURL.startsWith('https:') || iconURL.startsWith('data:'))
  ) {
    return iconURL;
  }

  for (const labelName of [
    'app.openshift.io/icon',
    'app.openshift.io/runtime',
    'app.kubernetes.io/name',
  ]) {
    const knownIcon = getImageForIconClass(`icon-${labels[labelName]}`);
    if (knownIcon) {
      return knownIcon;
    }
  }

  return defaultIcon;
};

/**
 * create all data that need to be shown on a topology data
 */
export const createTopologyNodeData = (
  resource: K8sResourceKind,
  overviewItem: TopologyOverviewItem,
  type: string,
  defaultIcon: string,
  operatorBackedService: boolean = false,
): TopologyDataObject => {
  const {
    current,
    previous,
    isRollingOut,
    buildConfigs,
    pipelines = [],
    pipelineRuns = [],
  } = overviewItem;
  const dcUID = _.get(resource, 'metadata.uid');
  const deploymentsLabels = _.get(resource, 'metadata.labels', {});
  const deploymentsAnnotations = _.get(resource, 'metadata.annotations', {});

  return {
    id: dcUID,
    name: resource?.metadata.name || deploymentsLabels['app.kubernetes.io/instance'],
    type,
    resource,
    resources: { ...overviewItem, isOperatorBackedService: operatorBackedService },
    pods: overviewItem.pods,
    data: {
      url: getRoutesURL(resource, overviewItem),
      kind: referenceFor(resource),
      editURL: deploymentsAnnotations['app.openshift.io/edit-url'],
      vcsURI: deploymentsAnnotations['app.openshift.io/vcs-uri'],
      builderImage: getIcon(resource, defaultIcon),
      isKnativeResource:
        type && (type === TYPE_EVENT_SOURCE || type === TYPE_KNATIVE_REVISION)
          ? true
          : isKnativeServing(resource, 'metadata.labels'),
      build: buildConfigs?.[0]?.builds?.[0],
      connectedPipeline: {
        pipeline: pipelines[0],
        pipelineRuns,
      },
      donutStatus: {
        pods: overviewItem.pods,
        current,
        previous,
        isRollingOut,
        dc: resource,
      },
    },
  };
};

/**
 * create node data for graphs
 */
export const getTopologyNodeItem = (
  resource: K8sResourceKind,
  type: string,
  data: any,
  nodeProps?: Omit<OdcNodeModel, 'type' | 'data' | 'children' | 'id' | 'label'>,
  children?: string[],
): OdcNodeModel => {
  const uid = resource?.metadata.uid;
  const name = resource?.metadata.name;
  const label = resource?.metadata.labels?.['app.openshift.io/instance'];

  return {
    id: uid,
    type,
    label: label || name,
    resource,
    data,
    ...(children && children.length && { children }),
    ...(nodeProps || {}),
  };
};

export const WorkloadModelProps = {
  width: NODE_WIDTH,
  height: NODE_HEIGHT,
  group: false,
  visible: true,
  style: {
    padding: NODE_PADDING,
  },
};

/**
 * create edge data for graph
 */
export const getTopologyEdgeItems = (
  dc: K8sResourceKind,
  resources: K8sResourceKind[],
): EdgeModel[] => {
  const annotations = _.get(dc, 'metadata.annotations');
  const edges = [];

  _.forEach(edgesFromAnnotations(annotations), (edge: string | ConnectsToData) => {
    // handles multiple edges
    const targetNode = _.get(
      _.find(resources, (deployment) => {
        let name;
        if (typeof edge === 'string') {
          name =
            deployment.metadata?.labels?.['app.kubernetes.io/instance'] ??
            deployment.metadata?.name;
          return name === edge;
        }
        name = deployment.metadata?.name;
        const { apiVersion: edgeApiVersion, kind: edgeKind, name: edgeName } = edge;
        const { kind, apiVersion } = deployment;
        let edgeExists = name === edgeName && kind === edgeKind;
        if (apiVersion) {
          edgeExists = edgeExists && apiVersion === edgeApiVersion;
        }
        return edgeExists;
      }),
      ['metadata', 'uid'],
    );
    const uid = _.get(dc, ['metadata', 'uid']);
    if (targetNode) {
      edges.push({
        id: `${uid}_${targetNode}`,
        type: TYPE_CONNECTS_TO,
        resource: dc,
        source: uid,
        target: targetNode,
      });
    }
  });

  return edges;
};

/**
 * create groups data for graph
 */
export const getTopologyGroupItems = (dc: K8sResourceKind): NodeModel => {
  const groupName = _.get(dc, ['metadata', 'labels', 'app.kubernetes.io/part-of']);
  if (!groupName) {
    return null;
  }

  return {
    id: `group:${groupName}`,
    type: TYPE_APPLICATION_GROUP,
    group: true,
    label: groupName,
    children: [_.get(dc, ['metadata', 'uid'])],
    width: GROUP_WIDTH,
    height: GROUP_HEIGHT,
    data: {},
    visible: true,
    collapsed: false,
    style: {
      padding: GROUP_PADDING,
    },
  };
};

const mergeGroupData = (newGroup: NodeModel, existingGroup: NodeModel): void => {
  if (!existingGroup.data?.groupResources && !newGroup.data?.groupResources) {
    return;
  }

  if (!existingGroup.data?.groupResources) {
    existingGroup.data.groupResources = [];
  }
  if (newGroup?.data?.groupResources) {
    newGroup.data.groupResources.forEach((obj) => {
      if (!existingGroup.data.groupResources.includes(obj)) {
        existingGroup.data.groupResources.push(obj);
      }
    });
  }
};

export const mergeGroup = (newGroup: NodeModel, existingGroups: NodeModel[]): void => {
  if (!newGroup) {
    return;
  }

  // find and add the groups
  const existingGroup = existingGroups.find((g) => g.group && g.id === newGroup.id);
  if (!existingGroup) {
    existingGroups.push(newGroup);
  } else {
    newGroup.children.forEach((id) => {
      if (!existingGroup.children.includes(id)) {
        existingGroup.children.push(id);
      }
      mergeGroupData(newGroup, existingGroup);
    });
  }
};

export const mergeGroups = (newGroups: NodeModel[], existingGroups: NodeModel[]): void => {
  if (!newGroups || !newGroups.length) {
    return;
  }
  newGroups.forEach((newGroup) => {
    mergeGroup(newGroup, existingGroups);
  });
};

export const addToTopologyDataModel = (
  newModel: Model,
  graphModel: Model,
  dataModelDepicters: TopologyDataModelDepicted[] = [],
) => {
  graphModel.edges.push(...newModel.edges);
  graphModel.nodes.push(
    ...newModel.nodes.filter(
      (n) =>
        !n.group &&
        !graphModel.nodes.find((existing) => {
          if (n.id === existing.id) {
            return true;
          }
          const { resource } = n as OdcNodeModel;
          return (
            !resource || !!dataModelDepicters.find((depicter) => depicter(resource, graphModel))
          );
        }),
    ),
  );
  mergeGroups(
    newModel.nodes.filter((n) => n.group),
    graphModel.nodes,
  );
};

/**
 * Mapping of TopologyResourcesObject key to k8s resource kind
 */
export interface KindsMap {
  [key: string]: string;
}

export const getWorkloadResources = (
  resources: TopologyDataResources,
  kindsMap: KindsMap,
  workloadTypes: string[] = WORKLOAD_TYPES,
) => {
  return _.flatten(
    workloadTypes.map((resourceKind) => {
      return resources[resourceKind]
        ? resources[resourceKind].data.map((res) => {
            const resKind = res.kind || kindsMap[resourceKind];
            let kind = resKind;
            let apiVersion;
            if (resKind && isGroupVersionKind(resKind)) {
              kind = kindForReference(resKind);
              apiVersion = apiVersionForReference(resKind);
            }
            return {
              kind,
              apiVersion,
              ...res,
            };
          })
        : [];
    }),
  );
};

export const getBaseWatchedResources = (namespace: string): WatchK8sResources<any> => {
  return {
    deploymentConfigs: {
      isList: true,
      kind: 'DeploymentConfig',
      namespace,
      optional: true,
    },
    deployments: {
      isList: true,
      kind: 'Deployment',
      namespace,
      optional: true,
    },
    daemonSets: {
      isList: true,
      kind: 'DaemonSet',
      namespace,
      optional: true,
    },
    pods: {
      isList: true,
      kind: 'Pod',
      namespace,
      optional: true,
    },
    replicationControllers: {
      isList: true,
      kind: 'ReplicationController',
      namespace,
      optional: true,
    },
    routes: {
      isList: true,
      kind: 'Route',
      namespace,
      optional: true,
    },
    services: {
      isList: true,
      kind: 'Service',
      namespace,
      optional: true,
    },
    replicaSets: {
      isList: true,
      kind: 'ReplicaSet',
      namespace,
      optional: true,
    },
    jobs: {
      isList: true,
      kind: 'Job',
      namespace,
      optional: true,
    },
    cronJobs: {
      isList: true,
      kind: 'CronJob',
      namespace,
      optional: true,
    },
    buildConfigs: {
      isList: true,
      kind: 'BuildConfig',
      namespace,
      optional: true,
    },
    builds: {
      isList: true,
      kind: 'Build',
      namespace,
      optional: true,
    },
    statefulSets: {
      isList: true,
      kind: 'StatefulSet',
      namespace,
      optional: true,
    },
    secrets: {
      isList: true,
      kind: 'Secret',
      namespace,
      optional: true,
    },
    clusterServiceVersions: {
      isList: true,
      kind: referenceForModel(ClusterServiceVersionModel),
      namespace,
      optional: true,
    },
    ...tknPipelineAndPipelineRunsWatchResources(namespace),
  };
};
