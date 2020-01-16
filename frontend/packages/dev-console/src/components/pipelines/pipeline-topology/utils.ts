import * as _ from 'lodash';
import { Pipeline, PipelineRun } from '../../../utils/pipeline-augment';
import { getPipelineTasks, PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { NODE_HEIGHT, NodeType, NODE_WIDTH } from './const';
import { PipelineEdgeModel, PipelineNodeModel, NodeCreator, NodeCreatorSetup } from './types';

const createGenericNode: NodeCreatorSetup = (type, width?) => (name, data) => ({
  id: name,
  data,
  height: NODE_HEIGHT,
  width: width != null ? width : NODE_WIDTH,
  type,
});

// Node variations
export const createTaskNode: NodeCreator = createGenericNode(NodeType.TASK_NODE);
export const createSpacerNode: NodeCreator = createGenericNode(NodeType.SPACER_NODE, 0);

export const handleParallelToParallelNodes = (nodes: PipelineNodeModel[]): PipelineNodeModel[] => {
  type ParallelNodeReference = {
    node: PipelineNodeModel;
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
  const newNodes: PipelineNodeModel[] = [];
  multiParallelToParallelList.forEach((p2p: ParallelNodeReference[]) => {
    // All nodes in each array share their runAfters
    const { runAfter } = p2p[0];

    const names: string[] = p2p.map((p2pData) => p2pData.node.id);
    const parallelSpacerName = `parallel-${names.join('-')}`;

    newNodes.push(
      createSpacerNode(parallelSpacerName, {
        task: {
          name: parallelSpacerName,
          runAfter,
          // TODO: Find a way to abstract this away from calls; it's a valid part of PipelineTasks, just not spacerNodes
          taskRef: { name: '' },
        },
      }),
    );

    // Update all impacted nodes to point at the spacer node as the spacer points at their original runAfters
    nodes.forEach((node) => {
      if (names.includes(node.id)) {
        const {
          data: { task },
        } = node;

        // Recreate the node with the new runAfter pointing to the spacer node
        newNodes.push(
          createTaskNode(node.id, {
            ...node.data,
            task: {
              ...task,
              runAfter: [parallelSpacerName],
            },
          }),
        );
      } else {
        // Unaffected node, just carry it over
        newNodes.push(node);
      }
    });
  });

  return newNodes;
};

const tasksToNodes = (
  taskList: PipelineVisualizationTaskItem[],
  pipeline?: Pipeline,
  pipelineRun?: PipelineRun,
): PipelineNodeModel[] => {
  const nodeList: PipelineNodeModel[] = taskList.map((task) =>
    createTaskNode(task.name, {
      task,
      pipeline,
      pipelineRun,
    }),
  );

  return handleParallelToParallelNodes(nodeList);
};

export const getEdgesFromNodes = (nodes: PipelineNodeModel[]): PipelineEdgeModel[] =>
  _.flatten(
    nodes.map((node) => {
      const {
        data: {
          task: { name, runAfter = [] },
        },
      } = node;

      if (runAfter.length === 0) return null;

      return runAfter.map((beforeName) => ({
        id: `${name}-to-${beforeName}`,
        type: 'edge',
        source: beforeName,
        target: name,
      }));
    }),
  ).filter((edgeList) => !!edgeList);

export const getTopologyNodesEdges = (
  pipeline: Pipeline,
  pipelineRun?: PipelineRun,
): { nodes: PipelineNodeModel[]; edges: PipelineEdgeModel[] } => {
  const taskList: PipelineVisualizationTaskItem[] = _.flatten(
    getPipelineTasks(pipeline, pipelineRun),
  );
  const nodes: PipelineNodeModel[] = tasksToNodes(taskList, pipeline, pipelineRun);
  const edges: PipelineEdgeModel[] = getEdgesFromNodes(nodes);

  return { nodes, edges };
};
