import { getRangeVectorData, getXaxisValues } from '../pipeline-metrics-utils';
import { promqlEmptyResponse, promqlResponse } from './pipeline-metrics-test-data';

describe('Pipeline Metrics utils: getXaxisValues', () => {
  const ONE_DAY_DURATION = 86400000;
  it('Should return an empty array if null value is passed', () => {
    expect(getXaxisValues(null)).toBeDefined();
    expect(getXaxisValues(null)).toHaveLength(0);
  });

  it('Should return an empty array if value is not divisible by duration', () => {
    expect(getXaxisValues(12)).toBeDefined();
    expect(getXaxisValues(12)).toHaveLength(0);
  });

  it('Should return an a valid timestamp', () => {
    const days = getXaxisValues(ONE_DAY_DURATION);
    expect(days).toHaveLength(1);
  });

  it('Should return a valid daywise value', () => {
    const sevenDaysBefore = ONE_DAY_DURATION * 7;
    const days = getXaxisValues(sevenDaysBefore);
    expect(days).toBeDefined();
    expect(days).toHaveLength(7);
  });
});

describe('Pipeline Metrics utils: getRangeVectorData', () => {
  it('Should return not throw error if null value is passed', () => {
    const invalidData = getRangeVectorData(null, null);
    expect(invalidData).toBeDefined();
    expect(invalidData).toHaveLength(0);
  });

  it('Should return not throw error if empty prometheus result is passed', () => {
    const emptyData = getRangeVectorData(promqlEmptyResponse, null);
    expect(emptyData).toBeDefined();
    expect(emptyData).toHaveLength(0);
  });

  it('Should return the properties for valid query result', () => {
    const validData = getRangeVectorData(promqlResponse, (x) => x);
    expect(validData).toBeDefined();
    expect(validData).toHaveLength(6);
    Object.keys(validData[0][0]).map((key) =>
      expect(['x', 'y', 'metric', 'time'].includes(key)).toBeTruthy(),
    );
  });

  it('Should return default mutatation `x`| `y` value if mutators are not passed', () => {
    const validData = getRangeVectorData(promqlResponse, null);
    expect(validData).toBeDefined();
    expect(validData).toHaveLength(6);
    expect(validData[0][0].x).toEqual(new Date('2020-11-30T14:16:22.710Z'));
    expect(validData[0][0].y).toEqual(30);
  });

  it('Should mutate the `x` and `y` property based on custom mutators', () => {
    const xMutator = (x) => x.metric.pipelinerun;
    const yMutator = (y) => y * 60;
    const validData = getRangeVectorData(promqlResponse, xMutator, yMutator);
    expect(validData).toBeDefined();
    expect(validData).toHaveLength(6);
    expect(validData[0][0].x).toEqual('nodejs-ex-effv75');
    expect(validData[0][0].y).toEqual(1800);
  });
});
