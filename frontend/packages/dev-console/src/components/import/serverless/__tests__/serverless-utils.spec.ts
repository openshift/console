import { getAutoscaleWindow } from '../serverless-utils';

describe('serverless-utils', () => {
  it('should return valid autoscale value and unit', () => {
    const [autoscaleValue, autoscaleUnit] = getAutoscaleWindow('6s');
    expect(autoscaleValue).toBe('6');
    expect(autoscaleUnit).toBe('s');
    const [autoscaleValue1, autoscaleUnit1] = getAutoscaleWindow('30m');
    expect(autoscaleValue1).toBe('30');
    expect(autoscaleUnit1).toBe('m');
  });
  it('should return valid value and unit', () => {
    const [autoscaleValue, autoscaleUnit] = getAutoscaleWindow('12min');
    expect(autoscaleValue).toBe('12');
    expect(autoscaleUnit).toBe('min');
  });
  it('should return valid value and unit', () => {
    const [autoscaleValue, autoscaleUnit] = getAutoscaleWindow('12min');
    expect(autoscaleValue).toBe('12');
    expect(autoscaleUnit).toBe('min');
  });
  it('should return undefined unit', () => {
    const [autoscaleValue, autoscaleUnit] = getAutoscaleWindow('');
    expect(autoscaleValue).toBe('');
    expect(autoscaleUnit).toBe(undefined);
    const [autoscaleValue1, autoscaleUnit1] = getAutoscaleWindow('12');
    expect(autoscaleValue1).toBe('12');
    expect(autoscaleUnit1).toBe('');
  });
});
