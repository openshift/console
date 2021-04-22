import { TaskKind } from '../types';

export const resultTask: TaskKind = {
  apiVersion: 'tekton.dev/v1beta1',
  kind: 'Task',
  metadata: {
    name: 'add-task',
    uid: '276780d6-96a8-4eb0-a7b9-54da43b7b4f9',
  },
  spec: {
    params: [
      {
        description: 'the first operand',
        name: 'first',
        type: 'string',
      },
      {
        description: 'the second operand',
        name: 'second',
        type: 'string',
      },
    ],
    results: [
      {
        description: 'the sum of the first and second operand',
        name: 'sum',
      },
    ],
    steps: [
      {
        // eslint-disable-next-line no-template-curly-in-string
        args: ['echo -n $((${OP1}+${OP2})) | tee $(results.sum.path);'],
        command: ['/bin/sh', '-c'],
        env: [
          {
            name: 'OP1',
            value: '$(params.first)',
          },
          {
            name: 'OP2',
            value: '$(params.second)',
          },
        ],
        image: 'alpine',
        name: 'add',
        resources: {},
      },
    ],
  },
};
