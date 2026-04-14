import {
  storeDetachedWebSocket,
  takeDetachedWebSocket,
  hasDetachedWebSocket,
  cleanupDetachedResource,
} from '../detached-ws-registry';

const mockK8sKillByName = jest.fn().mockResolvedValue(undefined);

jest.mock('../k8s', () => ({
  k8sKillByName: (...args: unknown[]) => mockK8sKillByName(...args),
}));

jest.mock('../../models', () => ({
  NamespaceModel: { kind: 'Namespace', apiVersion: 'v1' },
  PodModel: { kind: 'Pod', apiVersion: 'v1' },
}));

describe('detached-ws-registry', () => {
  afterEach(() => {
    // drain any leftover entries between tests
    ['a', 'b', 'c'].forEach((id) => takeDetachedWebSocket(id));
    mockK8sKillByName.mockClear();
  });

  describe('storeDetachedWebSocket / takeDetachedWebSocket / hasDetachedWebSocket', () => {
    it('should store and retrieve a websocket', () => {
      const ws = { fake: 'ws' };
      storeDetachedWebSocket('a', ws);
      expect(hasDetachedWebSocket('a')).toBe(true);
      expect(takeDetachedWebSocket('a')).toBe(ws);
    });

    it('should return undefined on second take (one-shot semantics)', () => {
      storeDetachedWebSocket('b', { fake: 'ws2' });
      takeDetachedWebSocket('b');
      expect(takeDetachedWebSocket('b')).toBeUndefined();
    });

    it('should report false for unknown ids', () => {
      expect(hasDetachedWebSocket('nonexistent')).toBe(false);
    });

    it('hasDetachedWebSocket returns false after take', () => {
      storeDetachedWebSocket('c', {});
      takeDetachedWebSocket('c');
      expect(hasDetachedWebSocket('c')).toBe(false);
    });
  });

  describe('cleanupDetachedResource', () => {
    it('should be a no-op for undefined cleanup', async () => {
      await cleanupDetachedResource(undefined);
      expect(mockK8sKillByName).not.toHaveBeenCalled();
    });

    it('should call k8sKillByName with NamespaceModel for type "namespace"', async () => {
      await cleanupDetachedResource({ type: 'namespace', name: 'openshift-debug-ns' });
      expect(mockK8sKillByName).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'Namespace' }),
        'openshift-debug-ns',
      );
    });

    it('should call k8sKillByName with PodModel for type "pod"', async () => {
      await cleanupDetachedResource({
        type: 'pod',
        name: 'debug-pod-abc',
        namespace: 'my-ns',
      });
      expect(mockK8sKillByName).toHaveBeenCalledWith(
        expect.objectContaining({ kind: 'Pod' }),
        'debug-pod-abc',
        'my-ns',
      );
    });

    it('should not call k8sKillByName for type "pod" without namespace', async () => {
      await cleanupDetachedResource({ type: 'pod', name: 'debug-pod-abc' });
      expect(mockK8sKillByName).not.toHaveBeenCalled();
    });

    it('should swallow errors from k8sKillByName', async () => {
      mockK8sKillByName.mockRejectedValueOnce(new Error('API error'));
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      await expect(
        cleanupDetachedResource({ type: 'namespace', name: 'ns-fail' }),
      ).resolves.toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });
});
