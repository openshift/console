import '../__mocks__/localStorage';
import { k8sCreate, k8sKinds } from '../public/module/k8s';

describe('k8s.k8sResource', () => {
  describe('create', () => {
    it('automatically lowercases resource name', () => {
      const data = { metadata: { name: 'TEST' }, spec: { volumes: [] } };

      k8sCreate(k8sKinds.Pod, data);
      // Since we're passing by reference we
      // can simply assert about the mutation of
      // the object here.
      expect(data.metadata.name).toEqual('test');
    });
  });
});
