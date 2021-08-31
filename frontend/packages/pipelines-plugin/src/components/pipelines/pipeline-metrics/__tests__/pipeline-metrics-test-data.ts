import { PrometheusResponse } from '@console/internal/components/graphs';

export const promqlEmptyResponse: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'matrix',
    result: [],
  },
};

export const groupedData = [
  {
    x: '2021-08-29T18:30:00.000Z',
    y: 5,
    metric: {},
  },
  {
    x: '2021-08-30T18:30:00.000Z',
    y: 7,
    metric: {},
  },
  {
    x: '2021-08-31T18:30:00.000Z',
    y: 15,
    metric: {},
  },
];

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
