import { isGroupVersionKind } from '../../module/k8s';
import { getResourceListPages } from '../list-pages';
import { getResourceDetailsPages } from '../resource-pages';

const isComponent = (Component) =>
  typeof Component === 'function' ||
  // connected redux component
  (typeof Component === 'object' && typeof Component.WrappedComponent === 'function');

describe('resourceDetailsPages', () => {
  getResourceDetailsPages().forEach((promise, name) => {
    it(`should have valid GVK name for ${name}`, () => {
      expect(name.length > 0).toBe(true);
      expect(isGroupVersionKind(name)).toBe(true);
    });

    it(`should resolve to a valid component for ${name}`, async () => {
      const Component = await promise();
      expect(isComponent(Component)).toBe(true);
    });
  });
});

describe('resourceListPages', () => {
  getResourceListPages().forEach((promise, name) => {
    it(`should have valid GVK name for ${name}`, () => {
      expect(isGroupVersionKind(name) || name === 'ClusterServiceVersionResources').toBe(true);
    });

    it(`should resolve to a valid component for ${name}`, async () => {
      const Component = await promise();
      expect(isComponent(Component)).toBe(true);
    });
  });
});
