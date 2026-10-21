import {
  DefaultTaskGroup,
  getEdgesFromNodes,
  getSpacerNodes,
  GraphComponent,
  RunStatus,
  SpacerNode,
  TaskEdge,
  WhenStatus,
  withPanZoom,
} from '@patternfly/react-topology';
import type { ComponentFactory, EdgeModel, GraphModel } from '@patternfly/react-topology/src/types';
import { ModelKind } from '@patternfly/react-topology/src/types';
import * as _ from 'lodash';
import { formatPrometheusDuration } from '@console/shared/src/utils/datetime';
import {
  ComputedStatus,
  SucceedConditionReason,
} from '@console/shipwright-plugin/src/components/logs/log-snippet-types';
import { pipelineRunStatus } from '@console/shipwright-plugin/src/components/logs/logs-utils';
import { TektonResourceLabel } from '@console/shipwright-plugin/src/components/logs/TektonTaskRunLog';
import type { TaskRunKind, TaskRunStatus } from '@console/shipwright-plugin/src/types';
import type {
  PipelineKind,
  PipelineRunKind,
  PipelineTask,
  PipelineTaskWithStatus,
} from '../../types/pipeline';
import CustomTaskNode from './CustomTaskNode';
import type { Vertex } from './dag';
import { DAG } from './dag';
import PipelineTaskNode from './PipelineTaskNode';
import type {
  PipelineRunAfterNodeModelData,
  PipelineMixedNodeModel,
  NodeCreatorSetup,
} from './types';
import {
  NODE_HEIGHT,
  NODE_WIDTH,
  NodeType,
  DEFAULT_BADGE_WIDTH,
  DEFAULT_NODE_ICON_WIDTH,
  NODE_PADDING,
  PipelineLayout,
  DEFAULT_FINALLLY_GROUP_PADDING,
  DEFAULT_NODE_HEIGHT,
} from './types';

export const conditions = {
  hasFromDependency: (task: PipelineTask): boolean =>
    task.resources &&
    task.resources.inputs &&
    task.resources.inputs.length > 0 &&
    !!task.resources.inputs[0].from,
  hasRunAfterDependency: (task: PipelineTask): boolean => task.runAfter && task.runAfter.length > 0,
};

/**
 * Appends the pipeline run status to each tasks in the pipeline.
 * @param pipeline
 * @param pipelineRun
 * @param isFinallyTasks
 */
export const appendPipelineRunStatus = (
  pipeline,
  pipelineRun,
  taskRuns: TaskRunKind[],
  isFinallyTasks = false,
) => {
  const tasks = (isFinallyTasks ? pipeline.spec.finally : pipeline.spec.tasks) || [];

  return tasks.map((task) => {
    if (!pipelineRun.status) {
      return task;
    }
    if (!taskRuns || taskRuns.length === 0) {
      if (pipelineRun.spec.status === SucceedConditionReason.PipelineRunCancelled) {
        return _.merge(task, { status: { reason: ComputedStatus.Cancelled } });
      }
      return _.merge(task, { status: { reason: ComputedStatus.Idle } });
    }

    const taskRun = _.find(
      taskRuns,
      (tr) => tr.metadata.labels[TektonResourceLabel.pipelineTask] === task.name,
    );
    const taskStatus: TaskRunStatus = taskRun?.status;

    const mTask = _.merge(task, {
      status: pipelineRun?.status?.taskRuns
        ? _.get(_.find(pipelineRun.status.taskRuns, { pipelineTaskName: task.name }), 'status')
        : taskStatus,
    });
    // append task duration
    if (mTask.status && mTask.status.completionTime && mTask.status.startTime) {
      const date =
        new Date(mTask.status.completionTime).getTime() -
        new Date(mTask.status.startTime).getTime();
      mTask.status.duration = formatPrometheusDuration(date);
    }
    // append task status
    if (!mTask.status) {
      mTask.status = { reason: ComputedStatus.Pending };
    } else if (mTask.status && mTask.status.conditions) {
      mTask.status.reason = pipelineRunStatus(mTask) || ComputedStatus.Pending;
    } else if (mTask.status && !mTask.status.reason) {
      mTask.status.reason = ComputedStatus.Pending;
    }
    return mTask;
  });
};

export const getPipelineTasks = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
    spec: {},
  },
  taskRuns: TaskRunKind[],
): PipelineTask[][] => {
  // Each unit in 'out' array is termed as stage | out = [stage1 = [task1], stage2 = [task2,task3], stage3 = [task4]]
  const out = [];
  if (!pipeline.spec?.tasks || _.isEmpty(pipeline.spec.tasks)) {
    return out;
  }
  const taskList = appendPipelineRunStatus(pipeline, pipelineRun, taskRuns);

  // Step 1: Push all nodes without any dependencies in different stages
  taskList.forEach((task) => {
    if (!conditions.hasFromDependency(task) && !conditions.hasRunAfterDependency(task)) {
      if (out.length === 0) {
        out.push([]);
      }
      out[0].push(task);
    }
  });

  // Step 2: Push nodes with 'from' dependency and stack similar tasks in a stage
  taskList.forEach((task) => {
    if (!conditions.hasRunAfterDependency(task) && conditions.hasFromDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (
            t.taskRef?.name === task.resources.inputs[0].from[0] ||
            t.name === task.resources.inputs[0].from[0]
          ) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0] &&
        nextToFlag[0].resources &&
        nextToFlag[0].resources.inputs &&
        nextToFlag[0].resources.inputs[0] &&
        nextToFlag[0].resources.inputs[0].from &&
        nextToFlag[0].resources.inputs[0].from[0] &&
        nextToFlag[0].resources.inputs[0].from[0] === task.resources.inputs[0].from[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });

  // Step 3: Push nodes with 'runAfter' dependencies and stack similar tasks in a stage
  taskList.forEach((task) => {
    if (conditions.hasRunAfterDependency(task)) {
      let flag = out.length - 1;
      for (let i = 0; i < out.length; i++) {
        for (const t of out[i]) {
          if (t.taskRef?.name === task.runAfter[0] || t.name === task.runAfter[0]) {
            flag = i;
          }
        }
      }
      const nextToFlag = out[flag + 1] ? out[flag + 1] : null;
      if (
        nextToFlag &&
        nextToFlag[0].runAfter &&
        nextToFlag[0].runAfter[0] &&
        nextToFlag[0].runAfter[0] === task.runAfter[0]
      ) {
        nextToFlag.push(task);
      } else {
        out.splice(flag + 1, 0, [task]);
      }
    }
  });
  return out;
};

export const getWhenStatus = (status: RunStatus): WhenStatus => {
  switch (status) {
    case RunStatus.Succeeded:
    case RunStatus.Failed:
      return WhenStatus.Met;
    case RunStatus.Skipped:
    case RunStatus['In Progress']:
    case RunStatus.Idle:
      return WhenStatus.Unmet;
    default:
      return undefined;
  }
};

export const getTaskWhenStatus = (task: PipelineTaskWithStatus): WhenStatus => {
  if (!task.when) {
    return undefined;
  }
  return getWhenStatus(task.status?.reason);
};

export const getSpacerNode = (node: PipelineMixedNodeModel): PipelineMixedNodeModel => ({
  ...node,
  height: 1,
  width: 1,
});

const createGenericNode: NodeCreatorSetup = (type, width?, height?) => (name, data) => ({
  id: name,
  label: data?.label || name,
  runAfterTasks: data?.runAfterTasks || [],
  ...(data && { data }),
  height: height ?? NODE_HEIGHT,
  width: width ?? NODE_WIDTH,
  type,
});

const createPipelineTaskNode = (type: NodeType, data: PipelineRunAfterNodeModelData) =>
  createGenericNode(type, data.width, data.height)(data.id || '', data);

export const getTextWidth = (text: string, font: string = '0.8rem RedHatText'): number => {
  if (!text || text.length === 0) {
    return 0;
  }
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    return text.length;
  }
  context.font = font;
  const { width } = context.measureText(text);
  return width;
};

export const dagreViewerComponentFactory: ComponentFactory = (kind: ModelKind, type: string) => {
  switch (kind) {
    case ModelKind.graph:
      return withPanZoom()(GraphComponent);
    case ModelKind.edge:
      return TaskEdge;
    case ModelKind.node:
      switch (type) {
        case NodeType.TASK_NODE:
        case NodeType.FINALLY_NODE:
          return PipelineTaskNode;
        case NodeType.CUSTOM_TASK_NODE:
          return CustomTaskNode;
        case NodeType.FINALLY_GROUP:
          return DefaultTaskGroup;
        case NodeType.SPACER_NODE:
          return SpacerNode;
        default:
          return undefined;
      }
    default:
      return undefined;
  }
};

export const extractDepsFromContextVariables = (contextVariable: string) => {
  const regex = /(?:(?:\$\(tasks.))([a-z0-9_-]+)(?:.results+)(?:[.^\w]+\))/g;
  let matches: RegExpExecArray | null;
  const deps: string[] = [];
  // eslint-disable-next-line no-cond-assign
  while ((matches = regex.exec(contextVariable)) !== null) {
    // This is necessary to avoid infinite loops with zero-width matches
    if (matches.index === regex.lastIndex) {
      regex.lastIndex++;
    }
    if (matches) {
      if (!deps.includes(matches[1])) {
        deps.push(matches[1]);
      }
    }
  }
  return deps;
};

export const getGraphDataModel = (
  pipeline: PipelineKind,
  pipelineRun: PipelineRunKind = {
    apiVersion: '',
    metadata: {},
    kind: 'PipelineRun',
    spec: {},
  },
  taskRuns: TaskRunKind[],
): {
  graph: GraphModel;
  nodes: PipelineMixedNodeModel[];
  edges: EdgeModel[];
} => {
  if (!pipeline) {
    return null;
  }

  const taskList = _.flatten(getPipelineTasks(pipeline, pipelineRun, taskRuns));

  const dag = new DAG();
  taskList?.forEach((task: PipelineTask) => {
    dag.addEdges(task.name, task, '', task.runAfter || []);
  });

  const nodes: PipelineMixedNodeModel[] = [];
  const maxWidthForLevel = {};
  dag.topologicalSort((v: Vertex) => {
    if (!maxWidthForLevel[v.level]) {
      maxWidthForLevel[v.level] = getTextWidth(v.name);
    } else {
      maxWidthForLevel[v.level] = Math.max(maxWidthForLevel[v.level], getTextWidth(v.name));
    }
  });
  dag.topologicalSort((vertex: Vertex) => {
    const runAfterTasks: string[] = [];
    const task = vertex.data;
    const depsFromContextVariables: string[] = [];
    if (task.params) {
      task.params.forEach((p) => {
        if (Array.isArray(p.value)) {
          p.value.forEach((paramValue) => {
            depsFromContextVariables.push(...extractDepsFromContextVariables(paramValue));
          });
        } else {
          depsFromContextVariables.push(...extractDepsFromContextVariables(p.value));
        }
      });
    }
    if (task?.when) {
      task.when.forEach(({ input, values }) => {
        if (values) {
          depsFromContextVariables.push(...extractDepsFromContextVariables(input));
          values.forEach((whenValue) => {
            depsFromContextVariables.push(...extractDepsFromContextVariables(whenValue));
          });
        }
      });
    }
    const dependancies = _.uniq([...vertex.dependancyNames]);
    if (dependancies) {
      dependancies.forEach((dep: string) => {
        const depObj = dag.vertices.get(dep);
        if (depObj?.level - vertex.level <= 1 || vertex.data.runAfter?.includes(depObj?.name)) {
          runAfterTasks.push(dep);
        }
      });
    }
    if (depsFromContextVariables.length > 0) {
      const v = depsFromContextVariables.map((d) => {
        return dag.vertices.get(d);
      });
      const minLevelDep = _.minBy(v, (d) => d?.level);
      const nearestDeps: Vertex[] = v.filter((v1) => v1?.level === minLevelDep?.level);
      nearestDeps.forEach((nd: Vertex) => {
        if (vertex.dependancyNames.includes(nd?.name)) {
          if (nd?.level - vertex.level <= 1 || vertex.dependancyNames.length === 0) {
            runAfterTasks.push(nd?.name);
          }
        }
      });
    }
    const badgePadding = Object.keys(pipelineRun.spec)?.length > 0 ? DEFAULT_BADGE_WIDTH : 0;
    const isTaskSkipped = pipelineRun?.status?.skippedTasks?.some((t) => t.name === task.name);
    const getNodeType = (taskKind: string) => {
      if (!taskKind || taskKind === 'Task' || taskKind === 'ClusterTask') {
        return NodeType.TASK_NODE;
      }
      return NodeType.CUSTOM_TASK_NODE;
    };

    nodes.push(
      createPipelineTaskNode(getNodeType(task?.taskRef?.kind), {
        id: vertex.name,
        label: vertex.name,
        width:
          maxWidthForLevel[vertex.level] +
          NODE_PADDING * 2 +
          DEFAULT_NODE_ICON_WIDTH +
          badgePadding,
        runAfterTasks,
        status: isTaskSkipped ? RunStatus.Skipped : vertex.data.status?.reason,
        whenStatus: getTaskWhenStatus(vertex.data),
        task: vertex.data,
        pipeline,
        pipelineRun,
      }),
    );
  });

  const finallyTaskList = appendPipelineRunStatus(pipeline, pipelineRun, taskRuns, true);

  const maxFinallyNodeName =
    finallyTaskList.sort((a, b) => b.name.length - a.name.length)[0]?.name || '';
  const finallyNodes = finallyTaskList.map((fTask) => {
    const isTaskSkipped = pipelineRun?.status?.skippedTasks?.some((t) => t.name === fTask.name);

    return createPipelineTaskNode(NodeType.FINALLY_NODE, {
      id: fTask.name,
      label: fTask.name,
      width:
        getTextWidth(maxFinallyNodeName) + NODE_PADDING * 2 + DEFAULT_FINALLLY_GROUP_PADDING * 2,
      height: DEFAULT_NODE_HEIGHT,
      runAfterTasks: [],
      status: isTaskSkipped ? RunStatus.Skipped : fTask.status?.reason,
      whenStatus: getTaskWhenStatus(fTask),
      task: fTask,
      pipeline,
      pipelineRun,
    });
  });

  const finallyGroup = finallyNodes.length
    ? [
        {
          id: 'finally-group-id',
          type: NodeType.FINALLY_GROUP,
          children: finallyNodes.map((n) => n.id),
          group: true,
          style: { padding: DEFAULT_FINALLLY_GROUP_PADDING },
        },
      ]
    : [];
  const spacerNodes: PipelineMixedNodeModel[] = getSpacerNodes(
    [...nodes, ...finallyNodes],
    NodeType.SPACER_NODE,
    [NodeType.FINALLY_NODE],
  ).map(getSpacerNode);

  const edges: EdgeModel[] = getEdgesFromNodes(
    [...nodes, ...spacerNodes, ...finallyNodes],
    NodeType.SPACER_NODE,
    NodeType.EDGE,
    NodeType.EDGE,
    [NodeType.FINALLY_NODE],
    NodeType.EDGE,
  );

  return {
    graph: {
      id: `${pipelineRun?.metadata?.name || pipeline?.metadata.name}-graph`,
      type: ModelKind.graph,
      layout: PipelineLayout.DAGRE_VIEWER,
      scaleExtent: [0.5, 1],
    },
    nodes: [...nodes, ...spacerNodes, ...finallyNodes, ...finallyGroup],
    edges,
  };
};
