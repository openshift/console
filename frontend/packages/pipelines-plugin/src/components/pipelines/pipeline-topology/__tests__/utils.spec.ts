import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import {
  getLastRegularTasks,
  getTopologyNodesEdges,
  getFinallyTaskHeight,
  hasWhenExpression,
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
    expect(getFinallyTaskHeight(numberOfTasks, !disableBuilder)).toBe(320);
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
