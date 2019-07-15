import { K8sResourceCondition, K8sResourceConditionStatus } from '@console/internal/module/k8s';
import { getConditionOKCount, getConditionString, getCondition } from '../condition-utils';

const createCondition = (status: K8sResourceConditionStatus): K8sResourceCondition<any> => ({
  status,
  type: '',
  lastTransitionTime: null,
  reason: '',
  message: '',
});

const createConditionOfType = (type: string): K8sResourceCondition<any> => ({
  status: K8sResourceConditionStatus.Unknown,
  type,
  lastTransitionTime: null,
  reason: '',
  message: '',
});

describe('condition-utils', () => {
  describe('getConditionOKCount', () => {
    it(`should count the number of conditions with status === 'True'`, () => {
      expect(getConditionOKCount(undefined)).toBe(0);
      expect(
        getConditionOKCount([
          createCondition(K8sResourceConditionStatus.False),
          createCondition(K8sResourceConditionStatus.False),
        ]),
      ).toBe(0);
      expect(
        getConditionOKCount([
          createCondition(K8sResourceConditionStatus.True),
          createCondition(K8sResourceConditionStatus.False),
          createCondition(K8sResourceConditionStatus.True),
        ]),
      ).toBe(2);
    });
  });

  describe('getConditionString', () => {
    it('should return a condition string with OK and total condition counts', () => {
      expect(getConditionString(undefined)).toBe('0 OK / 0');
      expect(
        getConditionString([
          createCondition(K8sResourceConditionStatus.False),
          createCondition(K8sResourceConditionStatus.False),
        ]),
      ).toBe('0 OK / 2');
      expect(
        getConditionString([
          createCondition(K8sResourceConditionStatus.True),
          createCondition(K8sResourceConditionStatus.False),
          createCondition(K8sResourceConditionStatus.True),
        ]),
      ).toBe('2 OK / 3');
    });
  });

  describe('getCondition', () => {
    it('should return the condition with matching type', () => {
      expect(getCondition(undefined, 'test')).toBe(undefined);
      const condition = createConditionOfType('test');
      expect(
        getCondition(
          [createConditionOfType('error'), condition, createConditionOfType('ready')],
          'test',
        ),
      ).toBe(condition);
    });
  });
});
