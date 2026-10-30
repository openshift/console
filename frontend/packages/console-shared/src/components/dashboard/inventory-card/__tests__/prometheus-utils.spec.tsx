import type { PrometheusResponse } from '@console/dynamic-plugin-sdk/src/extensions/console-types';
import {
  getPrometheusInventoryCount,
  getPrometheusNodeStatusGroups,
  getPrometheusPodStatusGroups,
  getPrometheusPVCStatusGroups,
} from '../prometheus-utils';

const response = (counts: Record<string, string>): PrometheusResponse => ({
  status: 'success',
  data: {
    resultType: 'vector',
    result: Object.entries(counts).map(([status, count]) => ({
      metric: { status },
      value: [0, count],
    })),
  },
});

it('retains healthy pod counts alongside all severity groups', () => {
  const groups = getPrometheusPodStatusGroups(
    response({
      Running: '9000',
      Succeeded: '900',
      Pending: '40',
      Terminating: '10',
      CrashLoopBackOff: '20',
      CreateContainerError: '10',
      Failed: '15',
      Unknown: '5',
    }),
  );
  expect(Object.values(groups).reduce((count, group) => count + group.count, 0)).toBe(10000);
  expect(groups.NOT_MAPPED.count).toBe(9900);
  expect(groups.ERROR).toEqual({
    count: 45,
    statusIDs: ['CrashLoopBackOff', 'CreateContainerError', 'Failed'],
    filterType: 'status',
  });
  expect(groups.PROGRESS.count).toBe(50);
  expect(groups.WARN.count).toBe(5);
});

it('retains unexpected statuses in the unknown group', () => {
  const groups = getPrometheusPodStatusGroups(response({ Unexpected: '3', Running: '7' }));
  expect(groups.UNKNOWN).toEqual({ count: 3, statusIDs: [] });
  expect(groups.NOT_MAPPED.count).toBe(7);
});

it('maps node readiness to the existing list filters', () => {
  const groups = getPrometheusNodeStatusGroups(response({ Ready: '120', 'Not Ready': '2' }));
  expect(groups.NOT_MAPPED.count).toBe(120);
  expect(groups.PROGRESS).toEqual({ count: 2, statusIDs: ['Not Ready'], filterType: 'status' });
});

it('maps PVC phases to the existing list filters', () => {
  const groups = getPrometheusPVCStatusGroups(response({ Bound: '100', Pending: '4', Lost: '1' }));
  expect(groups.NOT_MAPPED.count).toBe(100);
  expect(groups.PROGRESS).toEqual({ count: 4, statusIDs: ['Pending'], filterType: 'status' });
  expect(groups.ERROR).toEqual({ count: 1, statusIDs: ['Lost'], filterType: 'status' });
});

it('handles a count-only response and an explicit zero fallback', () => {
  const result: PrometheusResponse = {
    status: 'success',
    data: {
      resultType: 'vector',
      result: [
        { metric: {}, value: [0, '10'] },
        { metric: { status: 'Running' }, value: [0, '0'] },
      ],
    },
  };
  expect(getPrometheusInventoryCount(result)).toEqual({
    NOT_MAPPED: { count: 10, statusIDs: [] },
  });
  expect(getPrometheusInventoryCount(response({ Running: '0' }))).toEqual({
    NOT_MAPPED: { count: 0, statusIDs: [] },
  });
});

it('distinguishes absent metrics from an explicit zero', () => {
  expect(() => getPrometheusInventoryCount(response({}))).toThrow(
    'Inventory metrics are unavailable',
  );
  expect(getPrometheusPodStatusGroups(response({ Running: '0' })).NOT_MAPPED.count).toBe(0);
});
