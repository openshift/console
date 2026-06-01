import type { NodeKind } from '@console/internal/module/k8s';
import { buildIPToHostnameMap, resolveInstanceLabel } from '../NodesPage';

const createNode = (name: string, internalIP: string): NodeKind =>
  ({
    metadata: { name },
    status: {
      addresses: [{ type: 'InternalIP', address: internalIP }],
    },
  } as NodeKind);

describe('buildIPToHostnameMap', () => {
  it('maps InternalIP to node name', () => {
    const nodes = [
      createNode('ip-10-0-61-250.us-east-2.compute.internal', '10.0.61.250'),
      createNode('ip-10-0-105-200.us-east-2.compute.internal', '10.0.105.200'),
    ];
    const map = buildIPToHostnameMap(nodes);
    expect(map.get('10.0.61.250')).toBe('ip-10-0-61-250.us-east-2.compute.internal');
    expect(map.get('10.0.105.200')).toBe('ip-10-0-105-200.us-east-2.compute.internal');
  });

  it('returns empty map for empty nodes array', () => {
    expect(buildIPToHostnameMap([])).toEqual(new Map());
  });

  it('skips nodes without InternalIP', () => {
    const node = {
      metadata: { name: 'node-1' },
      status: { addresses: [{ type: 'Hostname', address: 'node-1' }] },
    } as NodeKind;
    const map = buildIPToHostnameMap([node]);
    expect(map.size).toBe(0);
  });

  it('skips nodes without a name', () => {
    const node = {
      metadata: {},
      status: { addresses: [{ type: 'InternalIP', address: '10.0.0.1' }] },
    } as NodeKind;
    const map = buildIPToHostnameMap([node]);
    expect(map.size).toBe(0);
  });
});

describe('resolveInstanceLabel', () => {
  const ipToHostname = new Map([['10.0.61.250', 'ip-10-0-61-250.us-east-2.compute.internal']]);

  it('remaps IP:port instance label to hostname', () => {
    expect(resolveInstanceLabel('10.0.61.250:9182', ipToHostname)).toBe(
      'ip-10-0-61-250.us-east-2.compute.internal',
    );
  });

  it('preserves hostname instance labels unchanged', () => {
    expect(resolveInstanceLabel('ip-10-0-105-200.us-east-2.compute.internal', ipToHostname)).toBe(
      'ip-10-0-105-200.us-east-2.compute.internal',
    );
  });

  it('preserves IP:port when IP is not in the map', () => {
    expect(resolveInstanceLabel('192.168.1.1:9182', ipToHostname)).toBe('192.168.1.1:9182');
  });

  it('handles undefined input', () => {
    expect(resolveInstanceLabel(undefined, ipToHostname)).toBeUndefined();
  });

  it('handles empty string', () => {
    expect(resolveInstanceLabel('', ipToHostname)).toBe('');
  });
});
