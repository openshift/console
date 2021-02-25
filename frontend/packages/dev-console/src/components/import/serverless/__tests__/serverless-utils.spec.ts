import { getAutoscaleWindow } from '../serverless-utils';

describe('serverless-utils', () => {
  it('should return valid autoscale value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '6s',
    );
    expect(autoscalewindow).toBe(6);
    expect(autoscalewindowUnit).toBe('s');
    expect(defaultAutoscalewindowUnit).toBe('s');
    const {
      autoscalewindow: autoscaleValue1,
      autoscalewindowUnit: autoscaleUnit1,
      defaultAutoscalewindowUnit: defaultScaleUnit1,
    } = getAutoscaleWindow('30m');
    expect(autoscaleValue1).toBe(30);
    expect(autoscaleUnit1).toBe('m');
    expect(defaultScaleUnit1).toBe('m');
  });
  it('should return valid value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '12min',
    );
    expect(autoscalewindow).toBe(12);
    expect(autoscalewindowUnit).toBe('min');
    expect(defaultAutoscalewindowUnit).toBe('min');
  });
  it('should return valid value and unit', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '12min',
    );
    expect(autoscalewindow).toBe(12);
    expect(autoscalewindowUnit).toBe('min');
    expect(defaultAutoscalewindowUnit).toBe('min');
  });
  it('should return default unit s', () => {
    const { autoscalewindow, autoscalewindowUnit, defaultAutoscalewindowUnit } = getAutoscaleWindow(
      '',
    );
    expect(autoscalewindow).toBe('');
    expect(autoscalewindowUnit).toBe('s');
    expect(defaultAutoscalewindowUnit).toBe('s');
    const {
      autoscalewindow: autoscaleValue1,
      autoscalewindowUnit: autoscaleUnit1,
      defaultAutoscalewindowUnit: defaultscaleUnit1,
    } = getAutoscaleWindow('12');
    expect(autoscaleValue1).toBe(12);
    expect(autoscaleUnit1).toBe('s');
    expect(defaultscaleUnit1).toBe('s');
  });
});
