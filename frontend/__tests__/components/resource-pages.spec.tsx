import {
  getResourceDetailsPages,
  getResourceListPages,
} from '../../public/components/resource-pages';
import { isGroupVersionKind } from '../../public/module/k8s';

describe('resourceDetailsPages', () => {
  it('contains a map of promises which resolve to every resource detail view component', (done) => {
    getResourceDetailsPages().forEach((promise, name) => {
      expect(name.length > 0).toBe(true);
      expect(isGroupVersionKind(name)).toBe(true);

      promise().then((Component) => {
        expect(typeof Component).toEqual('function');
        done();
      });
    });
  });
});

describe('resourceListPages', () => {
  it('contains map of promises which resolve to every resource list view component', (done) => {
    getResourceListPages().forEach((promise, name) => {
      expect(isGroupVersionKind(name) || name === 'ClusterServiceVersionResources').toBe(true);

      promise().then((Component) => {
        expect(typeof Component).toEqual('function');
        done();
      });
    });
  });
});
