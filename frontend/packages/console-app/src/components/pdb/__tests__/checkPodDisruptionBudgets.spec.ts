import { K8sResourceConditionStatus } from '@console/internal/module/k8s';
import { checkPodDisruptionBudgets } from '../utils/get-pdb-resources';

describe('checkPodDisruptionBudgets', () => {
  it('should return count and name when only one PodDisruptionBudget is violated', () => {
    const pdbArray = [
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 4,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb1',
        },
      },
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.True,
              reason: 'SufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb2',
        },
      },
    ];

    const result = checkPodDisruptionBudgets(pdbArray);
    expect(result).toEqual({ count: 1, name: 'pdb1' });
  });

  it('should return only count when multiple PodDisruptionBudgets are violated', () => {
    const pdbArray = [
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 4,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb1',
        },
      },
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 4,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb2',
        },
      },
    ];

    const result = checkPodDisruptionBudgets(pdbArray);
    expect(result).toEqual({ count: 2 });
  });

  it('should return count as 0 when no PodDisruptionBudget is violated', () => {
    const pdbArray = [
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 2,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.True,
              reason: 'SufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb1',
        },
      },
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 2,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.True,
              reason: 'SufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb2',
        },
      },
    ];

    const result = checkPodDisruptionBudgets(pdbArray);
    expect(result).toEqual({ count: 0 });
  });

  it('should handle when no PodDisruptionBudget is created in namespace', () => {
    const result = checkPodDisruptionBudgets([]);
    expect(result).toEqual({ count: 0 });
  });

  it('should return count as 0 when expectedPods value is 0', () => {
    const pdbArray = [
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 0,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb1',
        },
      },
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          expectedPods: 0,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb2',
        },
      },
    ];

    const result = checkPodDisruptionBudgets(pdbArray);
    expect(result).toEqual({ count: 0 });
  });

  it('should return count as 0 when expectedPods value is not defined', () => {
    const pdbArray = [
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb1',
        },
      },
      {
        spec: {
          selector: {},
        },
        status: {
          currentHealthy: 3,
          desiredHealthy: 0,
          conditions: [
            {
              type: 'DisruptionAllowed',
              status: K8sResourceConditionStatus.False,
              reason: 'InsufficientPods',
            },
          ],
        },
        metadata: {
          name: 'pdb2',
        },
      },
    ];

    const result = checkPodDisruptionBudgets(pdbArray);
    expect(result).toEqual({ count: 0 });
  });
});
