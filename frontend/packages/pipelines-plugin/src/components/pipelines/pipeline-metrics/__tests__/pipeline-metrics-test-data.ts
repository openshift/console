import { PrometheusResponse } from '@console/internal/components/graphs';

export const promqlEmptyResponse: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'matrix',
    result: [],
  },
};

export const promqlResponse: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'matrix',
    result: [
      {
        metric: {
          pipelinerun: 'nodejs-ex-effv75',
          task: 'git-clone',
        },
        values: [[1606745782.71, '30']],
      },
      {
        metric: {
          pipelinerun: 'nodejs-ex-effv75',
          task: 'openshift-client',
        },
        values: [[1606745782.71, '22']],
      },
      {
        metric: {
          pipelinerun: 'nodejs-ex-effv75',
          task: 's2i-nodejs',
        },
        values: [[1606745782.71, '91']],
      },
      {
        metric: {
          pipelinerun: 'nodejs-ex-test',
          task: 'git-clone',
        },
        values: [[1606745782.71, '94']],
      },
      {
        metric: {
          pipelinerun: 'nodejs-ex-test',
          task: 'openshift-client',
        },
        values: [[1606745782.71, '44']],
      },
      {
        metric: {
          pipelinerun: 'nodejs-ex-test',
          task: 's2i-nodejs',
        },
        values: [[1606745782.71, '240']],
      },
    ],
  },
};
