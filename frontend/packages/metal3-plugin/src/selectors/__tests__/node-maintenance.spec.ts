import { K8sResourceKind } from '@console/internal/module/k8s';
import { getNodeMaintenanceProgressPercent } from '../node-maintenance';

describe('getNodeMaintenanceProgressPercentage', () => {
  it('returns 100 when there are no evictionPods', () => {
    const maintenance: K8sResourceKind = {
      status: {
        pendingPods: [],
        evictionPods: 0,
        phase: 'Starting',
      },
    };
    expect(getNodeMaintenanceProgressPercent(maintenance)).toBe(100);
  });
  it('returns 100 when there are no pendingPods', () => {
    const maintenance: K8sResourceKind = {
      status: {
        pendingPods: [],
        evictionPods: 3,
        phase: 'Starting',
      },
    };
    expect(getNodeMaintenanceProgressPercent(maintenance)).toBe(100);
  });
  it('returns 0 when there is incorrectly less evictionPods than pendingPods', () => {
    const maintenance: K8sResourceKind = {
      status: {
        pendingPods: ['pod1', 'pod2', 'pod3'],
        evictionPods: 2,
        phase: 'Starting',
      },
    };
    expect(getNodeMaintenanceProgressPercent(maintenance)).toBe(0);
  });
  it('returns 25 when there are 4 evictionPods and 3 pendingPods', () => {
    const maintenance: K8sResourceKind = {
      status: {
        pendingPods: ['pod1', 'pod2', 'pod3'],
        evictionPods: 4,
        phase: 'Starting',
      },
    };
    expect(getNodeMaintenanceProgressPercent(maintenance)).toBe(25);
  });
  it('returns 75 when there are 4 evictionPods and 1 pendingPods', () => {
    const maintenance: K8sResourceKind = {
      status: {
        pendingPods: ['pod1'],
        evictionPods: 4,
        phase: 'Starting',
      },
    };
    expect(getNodeMaintenanceProgressPercent(maintenance)).toBe(75);
  });
});
