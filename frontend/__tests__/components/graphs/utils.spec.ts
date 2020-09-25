import {
  getRangeVectorStats,
  getInstantVectorStats,
} from '@console/internal/components/graphs/utils';
import { PrometheusResponse } from '@console/internal/components/graphs';
import { Humanize } from '@console/internal/components/utils';

const RANGE_VECTOR_RESPONSE: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'matrix',
    result: [
      {
        metric: { testMetric: 'test-0' },
        values: [
          [1, '123.4'],
          [2, '5678.9'],
        ],
      },
    ],
  },
};

const INSTANT_VECTOR_RESPONSE: PrometheusResponse = {
  status: 'success',
  data: {
    resultType: 'vector',
    result: [
      {
        metric: { testMetric: 'test-0' },
        value: [0, '123.45'],
      },
    ],
  },
};

describe('getRangeVectorStats()', () => {
  it('should return a properly formatted data object', () => {
    const data = getRangeVectorStats(RANGE_VECTOR_RESPONSE);
    expect(data[0].length).toBe(2);

    const [d1, d2] = data[0];
    const date1 = new Date(1000);
    date1.setSeconds(0, 0);
    const date2 = new Date(2000);
    date2.setSeconds(0, 0);
    expect(d1.x).toEqual(date1);
    expect(d1.y).toEqual(123.4);
    expect(d2.x).toEqual(date2);
    expect(d2.y).toEqual(5678.9);
  });
});

describe('getInstantVectorStats()', () => {
  it('should return a properly formatted data object', () => {
    const humanize: Humanize = (v: string) => ({
      string: `${v} units`,
      value: parseFloat(v),
      unit: 'units',
    });
    const [{ x, y, label }] = getInstantVectorStats(
      INSTANT_VECTOR_RESPONSE,
      'testMetric',
      humanize,
    );
    expect(x).toBe('test-0');
    expect(y).toBe(123.45);
    expect(label).toBe('123.45 units');
  });
});
