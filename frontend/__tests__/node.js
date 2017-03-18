import { isTrusted } from '../public/module/k8s/node';

describe('k8sNodes', () => {
  describe('#isTrusted', () => {
    it('returns true for falsy node', () => {
      expect(isTrusted()).toEqual(true);
    });

    it('returns true for node without metadata', () => {
      expect(isTrusted({})).toEqual(true);
    });

    it('returns true for node without annotations', () => {
      expect(isTrusted({metadata: {}})).toEqual(true);
    });

    it('returns true for node without "scheduler.alpha.kubernetes.io/taints" annotation', () => {
      expect(isTrusted({metadata: {annotations: {}}})).toEqual(true);
    });

    it('returns false for node with malformed "scheduler.alpha.kubernetes.io/taints" annotation', () => {
      expect(isTrusted({metadata: {annotations: {'scheduler.alpha.kubernetes.io/taints': ''}}})).toEqual(false);
    });

    it('returns true when "scheduler.alpha.kubernetes.io/taints" annotation is 🍆', () => {
      expect(isTrusted({metadata: {annotations: {'scheduler.alpha.kubernetes.io/taints': '[{"key": "🍆"}]'}}})).toEqual(true);
    });

    it('returns false when "scheduler.alpha.kubernetes.io/taints" annotation has untrusted key', () => {
      expect(isTrusted({metadata: {annotations: {'scheduler.alpha.kubernetes.io/taints': '[{"key": "untrusted","value": "true","effect": "NoSchedule"}]'}}})).toEqual(false);
    });
  });
});
