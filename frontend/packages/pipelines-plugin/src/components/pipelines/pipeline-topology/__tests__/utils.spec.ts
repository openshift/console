import { chart_color_black_400 as skippedColor } from '@patternfly/react-tokens/dist/js/chart_color_black_400';
import { chart_color_blue_300 as runningColor } from '@patternfly/react-tokens/dist/js/chart_color_blue_300';
import { chart_color_green_400 as successColor } from '@patternfly/react-tokens/dist/js/chart_color_green_400';
import { RunStatus, WhenStatus } from '@patternfly/react-topology';
import { PipelineExampleNames, pipelineTestData } from '../../../../test-data/pipeline-data';
import { ComputedStatus, PipelineTaskWithStatus } from '../../../../types';
import { NodeType } from '../const';
import {
  getLastRegularTasks,
  getGraphDataModel,
  getFinallyTaskHeight,
  hasWhenExpression,
  getFinallyTaskWidth,
  taskHasWhenExpression,
  nodesHasWhenExpression,
  getWhenExpressionDiamondState,
  extractDepsFromContextVariables,
  getTaskWhenStatus,
} from '../utils';

const pipelineData = pipelineTestData[PipelineExampleNames.COMPLEX_PIPELINE];
const { pipeline } = pipelineData;

const pipelineRun = {
  apiVersion: '',
  metadata: {},
  kind: 'PipelineRun',
  spec: {},
};

describe('getLastRegularTasks', () => {
  it('expect to handle the empty array input', () => {
    expect(getLastRegularTasks([])).toHaveLength(0);
  });

  it('expect to return the last regular task name in the pipeline', () => {
    const { nodes } = getGraphDataModel(pipeline, pipelineRun, []);
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
    const { nodes } = getGraphDataModel(pipelineWithMultipleLastTasks, pipelineRun, []);
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
    const { nodes } = getGraphDataModel(
      {
        ...pipelineWithWhenExpression,
        spec: {
          ...pipelineWithWhenExpression.spec,
          tasks: [pipelineWithWhenExpression.spec.tasks[0]],
        },
      },
      pipelineRun,
      [],
    );
    expect(nodesHasWhenExpression(nodes)).toBe(false);
  });

  it('expect to return true if the node contains when expressions', () => {
    const { nodes } = getGraphDataModel(pipelineWithWhenExpression, pipelineRun, []);
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

describe('When expression decorator color', () => {
  it('should return grey color in pipeline details page', () => {
    const { diamondColor, tooltipContent } = getWhenExpressionDiamondState(
      ComputedStatus.Idle,
      false,
      false,
    );
    expect(diamondColor).toBe('var(--pf-global--BackgroundColor--200)');
    expect(tooltipContent).toBe('When expression');
  });

  it('should return light-grey color in pipeline details page', () => {
    const { diamondColor, tooltipContent } = getWhenExpressionDiamondState(
      ComputedStatus.Idle,
      false,
      true,
    );
    expect(diamondColor).toBe('var(--pf-global--BackgroundColor--light-100)');
    expect(tooltipContent).toBe('When expression');
  });

  it('should return green color for failed task status in pipeline-run details page', () => {
    const { diamondColor, tooltipContent } = getWhenExpressionDiamondState(
      ComputedStatus.Failed,
      true,
      true,
    );
    expect(diamondColor).toBe(successColor.value);
    expect(tooltipContent).toBe('When expression was met');
  });

  it('should return blue color for running task status in pipeline-run details page', () => {
    const { diamondColor, tooltipContent } = getWhenExpressionDiamondState(
      ComputedStatus.Running,
      true,
      true,
    );
    expect(diamondColor).toBe(runningColor.value);
    expect(tooltipContent).toBe('When expression');
  });

  it('should return black color for skipped status in pipeline-run details page', () => {
    const { diamondColor, tooltipContent } = getWhenExpressionDiamondState(
      ComputedStatus.Skipped,
      true,
      true,
    );
    expect(diamondColor).toBe(skippedColor.value);
    expect(tooltipContent).toBe('When expression was not met');
  });
});

describe('extractDepsFromContextVariables: ', () => {
  it('should return emtpy array for invalid values', () => {
    expect(extractDepsFromContextVariables('')).toEqual([]);
    expect(extractDepsFromContextVariables(null)).toEqual([]);
    expect(extractDepsFromContextVariables(undefined)).toEqual([]);
  });

  it('should return empty array if the context variable string does not contain results', () => {
    expect(extractDepsFromContextVariables('$(context.pipeline.name)')).toEqual([]);
    expect(extractDepsFromContextVariables('$(context.pipelinerun.name)')).toEqual([]);
  });

  it('should return a task name if the context variable string contains results', () => {
    const contextVariable = '$(tasks.task1.results.sum)';
    expect(extractDepsFromContextVariables(contextVariable)).toEqual(['task1']);
  });

  it('should return a list of task names if the context variable string contains multiple results', () => {
    const contextVariable = '$(tasks.task1.results.sum)  $(tasks.task2.results.sum)';

    expect(extractDepsFromContextVariables(contextVariable)).toEqual(['task1', 'task2']);
  });
});

describe('getTaskWhenStatus:', () => {
  const [task1] = pipeline.spec.tasks;

  const taskWithStatus = (
    reason: RunStatus = RunStatus.Succeeded,
    when?: boolean,
  ): PipelineTaskWithStatus => {
    return {
      ...task1,
      ...(when && {
        when: [
          {
            input: 'params.test',
            operator: 'IN',
            values: ['pass'],
          },
        ],
      }),
      status: {
        reason,
      },
    };
  };

  it('should return undefined if the task does not have when expression', () => {
    expect(getTaskWhenStatus(taskWithStatus())).toBeUndefined();
  });

  it('should return a matching when status', () => {
    const succeededTask: PipelineTaskWithStatus = {
      ...taskWithStatus(RunStatus.Succeeded, true),
    };
    const skippedTask: PipelineTaskWithStatus = {
      ...taskWithStatus(RunStatus.Skipped, true),
    };
    expect(getTaskWhenStatus(succeededTask)).toBe(WhenStatus.Met);
    expect(getTaskWhenStatus(skippedTask)).toBe(WhenStatus.Unmet);
  });
});

describe('getGraphDataModel', () => {
  it('should return null for invalid values', () => {
    expect(getGraphDataModel(null, null, [])).toBeNull();
    expect(getGraphDataModel(undefined, undefined, [])).toBeNull();
  });

  it('should return graph, nodes and edges for valid pipeline', () => {
    const model = getGraphDataModel(pipeline, pipelineRun, []);
    expect(model.graph).toBeDefined();
    expect(model.nodes).toHaveLength(13);
    expect(model.edges).toHaveLength(19);
  });

  it('should return graph, nodes and edges for valid pipeline', () => {
    const model = getGraphDataModel(pipeline, pipelineRun, []);
    expect(model.graph).toBeDefined();
    expect(model.nodes).toHaveLength(13);
    expect(model.edges).toHaveLength(19);
  });

  it('should include the finally group and nodes for the pipeline with finally task', () => {
    const pData = pipelineTestData[PipelineExampleNames.PIPELINE_WITH_FINALLY];
    const { pipeline: pipelineWithFinallyTasks } = pData;

    const { nodes } = getGraphDataModel(pipelineWithFinallyTasks, pipelineRun, []);
    const finallyGroup = nodes.filter((n) => n.type === NodeType.FINALLY_GROUP);
    const finallyNodes = nodes.filter((n) => n.type === NodeType.FINALLY_NODE);

    expect(finallyGroup).toHaveLength(1);
    expect(finallyNodes).toHaveLength(1);
  });
});
