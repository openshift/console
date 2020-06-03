import * as dagre from 'dagre';
import * as _ from 'lodash';
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';
import { getPipelineTasks, PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import {
  NODE_HEIGHT,
  NodeType,
  NODE_WIDTH,
  AddNodeDirection,
  PipelineLayout,
  DAGRE_BUILDER_PROPS,
  DAGRE_VIEWER_PROPS,
} from './const';
import {
  PipelineEdgeModel,
  NodeCreator,
  NodeCreatorSetup,
  SpacerNodeModelData,
  TaskListNodeModelData,
  TaskNodeModelData,
  PipelineMixedNodeModel,
  PipelineTaskNodeModel,
  BuilderNodeModelData,
  PipelineRunAfterNodeModelData,
} from './types';

const createGenericNode: NodeCreatorSetup = (type, width?) => (name, data) => ({
  id: name,
  data,
  height: NODE_HEIGHT,
  width: width != null ? width : NODE_WIDTH,
  type,
});

// Node variations
export const createTaskNode: NodeCreator<TaskNodeModelData> = createGenericNode(NodeType.TASK_NODE);
export const createSpacerNode: NodeCreator<SpacerNodeModelData> = createGenericNode(
  NodeType.SPACER_NODE,
  0,
);
export const createTaskListNode: NodeCreator<TaskListNodeModelData> = createGenericNode(
  NodeType.TASK_LIST_NODE,
);
export const createInvalidTaskListNode: NodeCreator<TaskListNodeModelData> = createGenericNode(
  NodeType.INVALID_TASK_LIST_NODE,
);
export const createBuilderNode: NodeCreator<BuilderNodeModelData> = createGenericNode(
  NodeType.BUILDER_NODE,
);

export const getNodeCreator = (type: NodeType): NodeCreator<PipelineRunAfterNodeModelData> => {
  switch (type) {
    case NodeType.TASK_LIST_NODE:
      return createTaskListNode;
    case NodeType.BUILDER_NODE:
      return createBuilderNode;
    case NodeType.SPACER_NODE:
      return createSpacerNode;
    case NodeType.TASK_NODE:
    default:
      return createTaskNode;
  }
};

export const handleParallelToParallelNodes = (
  nodes: PipelineMixedNodeModel[],
): PipelineMixedNodeModel[] => {
  type ParallelNodeReference = {
    node: PipelineTaskNodeModel;
    runAfter: string[];
    atIndex: number;
  };
  type ParallelNodeMap = {
    [id: string]: ParallelNodeReference[];
  };

  // Collect only multiple run-afters
  const multipleRunBeforeMap: ParallelNodeMap = nodes.reduce((acc, node, idx) => {
    const {
      data: {
        task: { runAfter },
      },
    } = node;
    if (runAfter && runAfter.length > 1) {
      const id: string = [...runAfter]
        .sort((a, b) => a.localeCompare(b))
        .reduce((str, ref) => `${str}|${ref}`);

      if (!Array.isArray(acc[id])) {
        acc[id] = [];
      }
      acc[id].push({
        node,
        runAfter,
        atIndex: idx,
      });
    }
    return acc;
  }, {} as ParallelNodeMap);

  // Trim out single occurrences
  const multiParallelToParallelList: ParallelNodeReference[][] = Object.values(
    multipleRunBeforeMap,
  ).filter((data: ParallelNodeReference[]) => data.length > 1);

  if (multiParallelToParallelList.length === 0) {
    // No parallel to parallel
    return nodes;
  }

  // Insert a spacer node between the multiple nodes on the sides of a parallel-to-parallel
  const newNodes: PipelineMixedNodeModel[] = [];
  const newRunAfterNodeMap: { [nodeId: string]: string[] } = {};
  multiParallelToParallelList.forEach((p2p: ParallelNodeReference[]) => {
    // All nodes in each array share their runAfters
    const { runAfter } = p2p[0];

    const names: string[] = p2p.map((p2pData) => p2pData.node.id);
    const parallelSpacerName = `parallel-${names.join('-')}`;

    names.forEach((p2pNodeId) => {
      if (!Array.isArray(newRunAfterNodeMap[p2pNodeId])) {
        newRunAfterNodeMap[p2pNodeId] = [];
      }
      newRunAfterNodeMap[p2pNodeId].push(parallelSpacerName);
    });

    newNodes.push(
      createSpacerNode(parallelSpacerName, {
        task: {
          name: parallelSpacerName,
          runAfter,
        },
      }),
    );
  });

  // Update all impacted nodes to point at the spacer node as the spacer points at their original runAfters
  nodes.forEach((node) => {
    const newRunAfters: string[] | undefined = newRunAfterNodeMap[node.id];
    if (newRunAfters && newRunAfters.length > 0) {
      const {
        data: { task },
        type,
      } = node;

      const createNode: NodeCreator<PipelineRunAfterNodeModelData> = getNodeCreator(type);

      // Recreate the node with the new runAfter pointing to the spacer node
      newNodes.push(
        createNode(node.id, {
          ...node.data,
          task: {
            ...task,
            runAfter: newRunAfters,
          },
        }),
      );
    } else {
      // Unaffected node, just carry it over
      newNodes.push(node);
    }
  });

  return newNodes;
};

export const tasksToNodes = (
  taskList: PipelineVisualizationTaskItem[],
  pipeline?: Pipeline,
  pipelineRun?: PipelineRun,
): PipelineMixedNodeModel[] => {
  const nodeList: PipelineTaskNodeModel[] = taskList.map((task) =>
    createTaskNode(task.name, {
      task,
      pipeline,
      pipelineRun,
    }),
  );

  return handleParallelToParallelNodes(nodeList);
};

export const tasksToBuilderNodes = (
  taskList: PipelineVisualizationTaskItem[],
  onAddNode: (task: PipelineVisualizationTaskItem, direction: AddNodeDirection) => void,
  onNodeSelection: (task: PipelineVisualizationTaskItem) => void,
  getError: (taskName: string) => string,
  selectedIds: string[],
): PipelineMixedNodeModel[] => {
  return taskList.map((task) => {
    return createBuilderNode(task.name, {
      error: getError(task.name),
      task,
      selected: selectedIds.includes(task.name),
      onNodeSelection: () => {
        onNodeSelection(task);
      },
      onAddNode: (direction: AddNodeDirection) => {
        onAddNode(task, direction);
      },
    });
  });
};

export const getEdgesFromNodes = (nodes: PipelineMixedNodeModel[]): PipelineEdgeModel[] =>
  _.flatten(
    nodes.map((node) => {
      const {
        data: {
          task: { name: target, runAfter = [] },
        },
      } = node;

      if (runAfter.length === 0) return null;

      return runAfter.map((source) => ({
        id: `${source}~to~${target}`,
        type: 'edge',
        source,
        target,
      }));
    }),
  ).filter((edgeList) => !!edgeList);

export const getTopologyNodesEdges = (
  pipeline: Pipeline,
  pipelineRun?: PipelineRun,
): { nodes: PipelineMixedNodeModel[]; edges: PipelineEdgeModel[] } => {
  const taskList: PipelineVisualizationTaskItem[] = _.flatten(
    getPipelineTasks(pipeline, pipelineRun),
  );
  const nodes: PipelineMixedNodeModel[] = tasksToNodes(taskList, pipeline, pipelineRun);
  const edges: PipelineEdgeModel[] = getEdgesFromNodes(nodes);

  return { nodes, edges };
};

export const getLayoutData = (layout: PipelineLayout): dagre.GraphLabel => {
  switch (layout) {
    case PipelineLayout.DAGRE_BUILDER:
      return DAGRE_BUILDER_PROPS;
    case PipelineLayout.DAGRE_VIEWER:
      return DAGRE_VIEWER_PROPS;
    default:
      return null;
  }
};
