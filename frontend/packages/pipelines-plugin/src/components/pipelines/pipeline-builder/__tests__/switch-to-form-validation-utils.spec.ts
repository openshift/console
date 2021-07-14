import { initialPipelineFormData } from '../const';
import { withFormData, hasError } from './switch-to-form-validation-utils-data';
import {
  createSafeTask,
  embeddedTaskSpec,
  formDataBasicPassState,
  hasResults,
  shouldHaveFailed,
  shouldHavePassed,
} from './validation-utils-data';

const requiredMessage = 'Required';

describe('Pipeline Builder YAML to Form switch validation schema', () => {
  it('should pass initial values', async () => {
    await withFormData(formDataBasicPassState, '', {})
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if there is an invalid name', async () => {
    await withFormData(formDataBasicPassState, 'metadata.name', '123NoTaVaLiDnAmE-')
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass even if params name, default and description are empty', async () => {
    await withFormData(formDataBasicPassState, 'spec.params', [
      { name: undefined, default: undefined, description: undefined },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass when params default and description are provided', async () => {
    await withFormData(formDataBasicPassState, 'spec.params', [
      { name: 'test', default: 'value', description: 'test data' },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail when params is not an array', async () => {
    await withFormData(formDataBasicPassState, 'spec.params', {
      name: 'test',
      default: 'value',
      description: 'test data',
    })
      .then(shouldHaveFailed)
      .catch(hasError('spec.params', 'spec.params must be a `array` type'));
  });

  it('should fail when a param element properties have invalid values', async () => {
    await withFormData(formDataBasicPassState, 'spec.params', [
      {
        name: { test: 'test' },
        default: ['value'],
        description: 'test data',
      },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.params[0].name', 'spec.params[0].name must be a `string` type'));
  });

  it('should pass when resource has a valid name and type', async () => {
    await withFormData(formDataBasicPassState, 'spec.resources', [
      { name: 'git-value', type: 'git' },
      { name: 'image-value', type: 'image' },
      { name: 'cluster-value', type: 'cluster' },
      { name: 'storage-value', type: 'storage' },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass when provided an unknown resource type', async () => {
    await withFormData(formDataBasicPassState, 'spec.resources', [
      { name: 'invalid', type: 'not a type' },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass when provided no name or resource type', async () => {
    await withFormData(formDataBasicPassState, 'spec.resources', [
      { notName: 'invalid', notType: 'not a type' },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if resource is not an array', async () => {
    await withFormData(formDataBasicPassState, 'spec.resources', { name: 'git-value', type: 'git' })
      .then(shouldHaveFailed)
      .catch(hasError('spec.resources', 'spec.resources must be a `array` type'));
  });

  it('should fail when a resource element properties have invalid values', async () => {
    await withFormData(formDataBasicPassState, 'spec.resources', [
      {
        name: { test: 'git-value' },
        type: ['git'],
      },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.resources[0].name', 'spec.resources[0].name must be a `string` type'));
  });

  it('should pass when provided with a valid workspace name', async () => {
    await withFormData(formDataBasicPassState, 'spec.workspaces', [{ name: 'valid-name' }])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass when workspaces do not have a name', async () => {
    await withFormData(formDataBasicPassState, 'spec.workspaces', [{ notName: 'not-valid' }])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if workspace name has invalid values', async () => {
    await withFormData(formDataBasicPassState, 'spec.workspaces', [
      { name: { test: 'valid-name' } },
    ])
      .then(shouldHaveFailed)
      .catch(
        hasError('spec.workspaces[0].name', 'spec.workspaces[0].name must be a `string` type'),
      );
  });
});

describe('Tasks validation', () => {
  it('should pass if provided with a proper taskRef and name', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: 'task-1', taskRef: { name: 'external-task' } },
    ])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass even if a task has an incomplete taskRef', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [{ name: 'test', taskRef: {} }])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if provided a taskSpec and name', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [{ name: 'test', taskSpec: {} }])
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if a task does not have a name', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { notName: 'test', taskRef: { name: 'external-task' } },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].name', requiredMessage));
  });

  it('should fail if a task just has a name', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [{ name: 'test' }])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0]', 'TaskSpec or TaskRef must be provided.'));
  });

  it('should fail if a task has a name of invalid type', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: '1@Test-', taskRef: { name: 'external-task' } },
    ])
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].name',
          'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        ),
      );
  });

  it('should fail if a task has a taskRef of invalid type', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: 'test-1', taskRef: [{ name: 'external-task' }] },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].taskRef', 'spec.tasks[0].taskRef must be a `object` type'));
  });

  it('should fail if a task has a taskRef name of invalid type', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: 'test-1', taskRef: { name: ['external-task'] } },
    ])
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].taskRef.name',
          'spec.tasks[0].taskRef.name must be a `string` type',
        ),
      );
  });

  it('should fail if a task has a taskSpec of invalid type', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: 'test-1', taskSpec: [embeddedTaskSpec] },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].taskSpec', 'spec.tasks[0].taskSpec must be a `object` type'));
  });
});

describe('Validate Task Run Afters', () => {
  it('should fail if runAfter has invalid entry', async () => {
    await withFormData(formDataBasicPassState, 'spec.tasks', [
      { name: 'test', runAfter: 'not-an-array', taskRef: { name: 'external-task' } },
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].runAfter', 'spec.tasks[0].runAfter must be a `array` type'));
  });

  it('should fail if runAfter is an array of strings that do not match other tasks', async () => {
    const firstTask = createSafeTask('first-task');
    const secondTask = {
      name: 'test',
      runAfter: ['other-task'],
      taskRef: { name: 'external-task' },
    };
    await withFormData({ ...initialPipelineFormData, tasks: [firstTask] }, 'spec.tasks', [
      firstTask,
      secondTask,
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[1].runAfter[0]', 'Invalid runAfter'));
  });

  it('should fail if any of the runAfter entries has invalid value', async () => {
    const firstTask = createSafeTask('first-task');
    const secondTask = {
      name: 'second-task',
      runAfter: ['first-task'],
      taskRef: { name: 'second-task' },
    };
    const thirdTask = {
      name: 'third-task',
      runAfter: ['first-task', { after: 'second-task' }],
      taskRef: { name: 'third-task' },
    };
    await withFormData(
      { ...initialPipelineFormData, tasks: [firstTask, secondTask] },
      'spec.tasks',
      [firstTask, secondTask, thirdTask],
    )
      .then(shouldHaveFailed)
      .catch(
        hasError('spec.tasks[2].runAfter[1]', 'spec.tasks[2].runAfter[1] must be a `string` type'),
      );
  });

  it('should pass if runAfter is an array of strings that match other task names', async () => {
    const firstTask = createSafeTask('first-task');
    const secondTask = {
      name: 'second-task',
      runAfter: ['first-task'],
      taskRef: { name: 'second-task' },
    };
    const thirdTask = {
      name: 'third-task',
      runAfter: ['first-task', 'second-task'],
      taskRef: { name: 'third-task' },
    };
    await withFormData(
      { ...initialPipelineFormData, tasks: [firstTask, secondTask] },
      'spec.tasks',
      [firstTask, secondTask, thirdTask],
    )
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if runAfter is the task itself', async () => {
    const firstTask = createSafeTask('first-task');
    const secondTask = {
      name: 'second-task',
      runAfter: ['second-task'],
      taskRef: { name: 'second-task' },
    };
    await withFormData({ ...initialPipelineFormData, tasks: [firstTask] }, 'spec.tasks', [
      firstTask,
      secondTask,
    ])
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[1].runAfter[0]', 'Invalid runAfter'));
  });

  it('should pass if runAfter is an array of strings that match listTasks or tasks names', async () => {
    const tasks = [
      { name: 'first-task', taskRef: { name: 'external-task' } },
      {
        name: 'second-task',
        taskRef: { name: 'external-task' },
        runAfter: ['first-task', 'first-list-task'],
      },
    ];
    const listTasks = [{ name: 'first-list-task', runAfter: ['first-task'] }];
    await withFormData(
      {
        ...initialPipelineFormData,
        tasks,
        listTasks,
      },
      'spec.tasks',
      tasks,
    )
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if runAfter is on a taskSpec task', async () => {
    const tasks = [
      { name: 'first', taskSpec: embeddedTaskSpec },
      { name: 'second', taskSpec: embeddedTaskSpec, runAfter: ['first'] },
    ];
    await withFormData(
      {
        ...initialPipelineFormData,
        tasks,
      },
      'spec.tasks',
      tasks,
    )
      .then(hasResults)
      .catch(shouldHavePassed);
  });
});

describe('Validate Task Parameters', () => {
  it('should pass if the task params is empty', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: [],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task params have no name', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: [{ notName: 'not-a-name', value: 'value' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task params has no value', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskSpec: embeddedTaskSpec,
        params: [{ name: 'param-name', notValue: 'not-a-value' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task params has a name and value', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskSpec: embeddedTaskSpec,
        params: [{ name: 'param-name', value: 'param-value' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task params has a value having type array of string', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskSpec: embeddedTaskSpec,
        params: [{ name: 'param-name', value: ['param-value'] }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if the task params is not an array', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: { name: 'param-name', value: 'param-value' },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].params', 'spec.tasks[0].params must be a `array` type'));
  });

  it('should fail if a task param has invalid name', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: [{ name: { label: 'param-name' }, value: 'param-value' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].params[0].name',
          'spec.tasks[0].params[0].name must be a `string` type',
        ),
      );
  });

  it('should fail if a task param has value of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: [{ name: 'param-name', value: { label: 'param-value' } }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].params[0].value',
          'spec.tasks[0].params[0].value must be a `string` type',
        ),
      );
  });

  it('should fail if a task param has value entries of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        params: [{ name: 'param-name', value: ['valid-param-value', ['invalid-param-value']] }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].params[0].value[1]',
          'spec.tasks[0].params[0].value[1] must be a `string` type',
        ),
      );
  });
});

describe('Validate Resources', () => {
  it('should pass if the task resources is empty', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {},
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task resources have empty inputs and outputs', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: { inputs: [], output: [] },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task resources have valid inputs and outputs', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ name: 'input', resource: 'git' }],
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task resource have no inputs', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: { notInputs: 'not-input', outputs: [{ name: 'output', resource: 'image' }] },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task resource have no outputs', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ name: 'input', resource: 'git' }],
          notOutput: 'not-output',
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task resource have no name for an input', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ notName: 'not-name', resource: 'git' }],
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task resource have no resource for an input', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ name: 'input', notResource: 'not-resource' }],
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if the task resources has invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: [
          {
            inputs: [{ name: 'input', resource: 'git' }],
            outputs: [{ name: 'output', resource: 'image' }],
          },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError('spec.tasks[0].resources', 'spec.tasks[0].resources must be a `object` type'),
      );
  });

  it('should fail if a task resource has invalid type for inputs', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: { name: 'input', resource: 'git' },
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].resources.inputs',
          'spec.tasks[0].resources.inputs must be a `array` type',
        ),
      );
  });

  it('should fail if a task resource has invalid type for name in an input', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ name: ['input'], resource: 'git' }],
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].resources.inputs[0].name',
          'spec.tasks[0].resources.inputs[0].name must be a `string` type',
        ),
      );
  });

  it('should fail if a task resource has invalid type for resource in an input', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        resources: {
          inputs: [{ name: 'input', resource: ['git'] }],
          outputs: [{ name: 'output', resource: 'image' }],
        },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].resources.inputs[0].resource',
          'spec.tasks[0].resources.inputs[0].resource must be a `string` type',
        ),
      );
  });
});

describe('Validate Task Workspaces', () => {
  it('should pass if the task workspaces is empty', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task workspaces contains valid entries', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [
          { name: 'first', workspace: 'first-workspace' },
          { name: 'second', workspace: 'second-workspace' },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task workspace contains no name', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [{ notName: 'first', workspace: 'first-workspace' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task workspace contains no workspace', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [{ name: 'first', notWorkspace: 'first-workspace' }],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if the task workspaces has invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: { name: 'first', workspace: 'first-workspace' },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError('spec.tasks[0].workspaces', 'spec.tasks[0].workspaces must be a `array` type'),
      );
  });

  it('should fail if the task workspaces has entries of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [
          [{ name: 'first', workspace: 'first-workspace' }],
          { name: 'second', workspace: 'second-workspace' },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].workspaces[0]',
          'spec.tasks[0].workspaces[0] must be a `object` type',
        ),
      );
  });

  it('should fail if a task workspace has name of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [
          { name: 'first', workspace: 'first-workspace' },
          { name: ['second'], workspace: 'second-workspace' },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].workspaces[1].name',
          'spec.tasks[0].workspaces[1].name must be a `string` type',
        ),
      );
  });

  it('should fail if a task workspace has workspace of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        workspaces: [
          { name: 'first', workspace: ['first-workspace'] },
          { name: 'second', workspace: 'second-workspace' },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].workspaces[0].workspace',
          'spec.tasks[0].workspaces[0].workspace must be a `string` type',
        ),
      );
  });
});

describe('Validate Task When', () => {
  it('should pass if the task when is empty', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if the task when contains valid entries', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          { input: '$(params.test)', operator: 'in', values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task when expression contains no input', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { notInput: 'not-input', operator: 'in', values: ['test-values-one'] },
          { input: '$(params.test)', operator: 'in', values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task when expression contains no operator', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', notOperator: 'not-operator', values: ['test-values-one'] },
          { input: '$(params.test)', operator: 'in', values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should pass if a task when expression contains no values', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', notValues: 'not-values' },
          { input: '$(params.test)', operator: 'in', values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(hasResults)
      .catch(shouldHavePassed);
  });

  it('should fail if the task when expression has invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].when', 'spec.tasks[0].when must be a `array` type'));
  });

  it('should fail if the task when expression has entries of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          [{ input: '$(params.test)', operator: 'in', values: ['test-value-two'] }],
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(hasError('spec.tasks[0].when[1]', 'spec.tasks[0].when[1] must be a `object` type'));
  });

  it('should fail if a task when expression has input of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          { input: ['$(params.test)'], operator: 'in', values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].when[1].input',
          'spec.tasks[0].when[1].input must be a `string` type',
        ),
      );
  });

  it('should fail if a task when expression has operator of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          { input: '$(params.test)', operator: ['in'], values: ['test-value-two'] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].when[1].operator',
          'spec.tasks[0].when[1].operator must be a `string` type',
        ),
      );
  });

  it('should fail if a task when expression has values of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          { input: '$(params.test)', operator: 'in', values: 'test-value-two' },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].when[1].values',
          'spec.tasks[0].when[1].values must be a `array` type',
        ),
      );
  });

  it('should fail if a task when expression has values with entries of invalid type', async () => {
    const tasks = [
      {
        name: 'test-task',
        taskRef: { name: 'external-task' },
        when: [
          { input: '$(params.test)', operator: 'in', values: ['test-values-one'] },
          { input: '$(params.test)', operator: 'in', values: [{ test: 'test-value-two' }] },
        ],
      },
    ];
    await withFormData(formDataBasicPassState, 'spec.tasks', tasks)
      .then(shouldHaveFailed)
      .catch(
        hasError(
          'spec.tasks[0].when[1].values[0]',
          'spec.tasks[0].when[1].values[0] must be a `string` type',
        ),
      );
  });
});
