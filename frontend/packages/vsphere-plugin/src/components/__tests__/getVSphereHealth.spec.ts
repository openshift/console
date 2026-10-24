import { HealthState } from '@console/dynamic-plugin-sdk';
import { formatHealthWarningMessage, getVSphereHealth } from '../getVSphereHealth';

const t = (key: string, options?: Record<string, unknown>) => {
  if (options?.message !== undefined && options?.timestamp !== undefined) {
    return `${options.message} (Last detected ${options.timestamp})`;
  }
  if (key.includes('Failing') && options?.reason) {
    return `Failing ${options.reason}`;
  }
  return key.replace(/^vsphere-plugin~/, '');
};

const loadedConfigMap = {
  loaded: true,
  loadError: undefined,
  data: { metadata: { name: 'cloud-provider-config' } },
};

const prometheusResponse = (result: Array<{ reason: string; value: [number, string] }>) => [
  {
    response: {
      status: 'success',
      data: {
        result: result.map(({ reason, value }) => ({
          metric: { reason },
          value,
        })),
      },
    },
  },
];

describe('formatHealthWarningMessage', () => {
  it('appends last detected time from Prometheus sample timestamp', () => {
    const message = formatHealthWarningMessage(t, 'Invalid credentials', [1704067200, '1']);
    expect(message).toContain('Invalid credentials');
    expect(message).toContain('Last detected');
    expect(message).not.toContain('1704067200');
  });

  it('returns the base message when timestamp is missing', () => {
    expect(formatHealthWarningMessage(t, 'Synchronization failed')).toBe('Synchronization failed');
  });
});

describe('getVSphereHealth', () => {
  it('includes last detected time for invalid credentials warnings', () => {
    const health = getVSphereHealth(
      t,
      prometheusResponse([{ reason: 'InvalidCredentials', value: [1704067200, '1'] }]),
      loadedConfigMap,
    );

    expect(health.state).toBe(HealthState.WARNING);
    expect(health.message).toContain('Invalid credentials');
    expect(health.message).toContain('Last detected');
  });

  it('includes last detected time for synchronization failures', () => {
    const health = getVSphereHealth(
      t,
      prometheusResponse([{ reason: 'SyncError', value: [1704067200, '2'] }]),
      loadedConfigMap,
    );

    expect(health.state).toBe(HealthState.WARNING);
    expect(health.message).toContain('Synchronization failed');
    expect(health.message).toContain('Last detected');
  });

  it('includes last detected time for other failing metrics', () => {
    const health = getVSphereHealth(
      t,
      prometheusResponse([{ reason: 'DatastoreAccess', value: [1704067200, '1'] }]),
      loadedConfigMap,
    );

    expect(health.state).toBe(HealthState.WARNING);
    expect(health.message).toContain('Failing DatastoreAccess');
    expect(health.message).toContain('Last detected');
  });
});
