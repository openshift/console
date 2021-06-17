import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import {
  getLastRegularTasks,
  getTopologyNodesEdges,
  getFinallyTaskHeight,
  hasWhenExpression,
  getFinallyTaskWidth,
  taskHasWhenExpression,
  nodesHasWhenExpression,
  getEdgesFromNodes,
} from '../utils';

const pipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
const { pipeline } = pipelineData;
const pipelineWithFinally = {
  ...pipeline,
  spec: {
    ...pipeline.spec,
    finally: [{ ...pipeline.spec.tasks[0], name: 'finally-task' }],
  },
};

describe('getTopologyNodesEdges', () => {
  it('expect to return nodes and edges for a pipeline without finally tasks', () => {
    const { nodes, edges } = getTopologyNodesEdges(pipeline);
    expect(nodes).toHaveLength(pipeline.spec.tasks.length);
    expect(edges).toHaveLength(19);
  });

  it('expect to return nodes and edges for a pipeline with finally tasks', () => {
    const { nodes, edges } = getTopologyNodesEdges(pipelineWithFinally);
    expect(nodes).toHaveLength(
      pipelineWithFinally.spec.tasks.length + pipelineWithFinally.spec.finally.length,
    );
    expect(edges).toHaveLength(20);
  });
});

describe('getLastRegularTasks', () => {
  it('expect to handle the empty array input', () => {
    expect(getLastRegularTasks([])).toHaveLength(0);
  });

  it('expect to return the last regular task name in the pipeline', () => {
    const { nodes } = getTopologyNodesEdges(pipeline);
    expect(getLastRegularTasks(nodes)).toHaveLength(1);
    expect(getLastRegularTasks(nodes)).toEqual(['verify']);
  });

  it('expect to return the list of task names that will be executed at the end', () => {
    const [task1, task2, task3, task4] = pipeline.spec.tasks;
    const pipelineWithMultipleLastTasks = {
      ...pipeline,
      spec: {
        ...pipeline.spec,
        tasks: [task1, task2, task3, task4],
      },
    };
    const { nodes } = getTopologyNodesEdges(pipelineWithMultipleLastTasks);
    expect(getLastRegularTasks(nodes)).toHaveLength(3);
    expect(getLastRegularTasks(nodes)).toEqual(['analyse-code', 'style-checks', 'find-bugs']);
  });
});

describe('getFinallyTaskHeight', () => {
  it('expect to return dynamic height for finally task based on tasks length and builder options ', () => {
    const numberOfTasks = 5;
    const disableBuilder = true;
    expect(getFinallyTaskHeight(numberOfTasks, disableBuilder)).toBe(290);
    expect(getFinallyTaskHeight(numberOfTasks, !disableBuilder)).toBe(340);
  });
});

describe('getFinallyTaskWidth', () => {
  it('expect to return larger width if any nodes present in finally section', () => {
    const numberOfTasks = 5;
    expect(getFinallyTaskWidth(numberOfTasks)).toBe(205);
  });

  it('expect to return smaller width if nodes are not present in finally section', () => {
    const numberOfTasks = 0;
    expect(getFinallyTaskWidth(numberOfTasks)).toBe(180);
  });
});

describe('taskHasWhenExpression', () => {
  const conditionalPipeline = pipelineTestData[PipelineExampleNames.CONDITIONAL_PIPELINE];

  it('expect to return false if the task does not contain when expressions', () => {
    const taskWithoutWhenExpression = conditionalPipeline.pipeline.spec.tasks[0];
    expect(taskHasWhenExpression(taskWithoutWhenExpression)).toBe(false);
  });

  it('expect to return true if the task contains when expressions', () => {
    const taskWithWhenExpression = conditionalPipeline.pipeline.spec.tasks[1];
    expect(taskHasWhenExpression(taskWithWhenExpression)).toBe(true);
  });
});

describe('nodesHasWhenExpression', () => {
  const conditionalPipeline = pipelineTestData[PipelineExampleNames.CONDITIONAL_PIPELINE];
  const { pipeline: pipelineWithWhenExpression } = conditionalPipeline;

  it('expect to return false if the nodes does not contain when expressions', () => {
    const { nodes } = getTopologyNodesEdges({
      ...pipelineWithWhenExpression,
      spec: {
        ...pipelineWithWhenExpression.spec,
        tasks: [pipelineWithWhenExpression.spec.tasks[0]],
      },
    });
    expect(nodesHasWhenExpression(nodes)).toBe(false);
  });

  it('expect to return true if the node contains when expressions', () => {
    const { nodes } = getTopologyNodesEdges(pipelineWithWhenExpression);
    expect(nodesHasWhenExpression(nodes)).toBe(true);
  });
});

describe('hasWhenExpression', () => {
  const conditionalPipeline = pipelineTestData[PipelineExampleNames.CONDITIONAL_PIPELINE];
  const { pipeline: pipelineWithWhen } = conditionalPipeline;
  const pipelineWithWhenAndFinally = {
    ...pipelineWithWhen,
    spec: {
      ...pipelineWithWhen.spec,
      finally: [{ ...pipelineWithWhen.spec.tasks[0], name: 'finally-task-with-when' }],
    },
  };
  it('expect to return false if the pipeline does not contain when expression', () => {
    expect(hasWhenExpression(pipeline)).toBe(false);
  });

  it('expect to return true if the regular tasks in the pipeline contains when expression', () => {
    expect(hasWhenExpression(pipelineWithWhen)).toBe(true);
  });

  it('expect to return true if the finally tasks in the pipeline contains when expression', () => {
    expect(hasWhenExpression(pipelineWithWhenAndFinally)).toBe(true);
  });
});

describe('getEdgesFromNodes', () => {
  it('should contain correct number of edges based on the runAfters', () => {
    const [task1, task2, task3, task4] = pipeline.spec.tasks;
    const pipelineWithMultipleLastTasks = {
      ...pipeline,
      spec: {
        ...pipeline.spec,
        tasks: [task1, task2, task3, task4],
      },
    };
    const { nodes } = getTopologyNodesEdges(pipelineWithMultipleLastTasks);
    expect(getEdgesFromNodes(nodes)).toHaveLength(3);
  });

  it('should exclude the invalid runAfter names', () => {
    const [task1, task2, task3, task4] = pipeline.spec.tasks;
    const pipelineWithInvalidRunAfter = {
      ...pipeline,
      spec: {
        ...pipeline.spec,
        tasks: [
          task1,
          task2,
          task3,
          {
            ...task4,
            runAfter: [...task4.runAfter, 'fake-task-name'],
          },
        ],
      },
    };
    const { nodes } = getTopologyNodesEdges(pipelineWithInvalidRunAfter);
    expect(getEdgesFromNodes(nodes)).toHaveLength(3);
  });
});
