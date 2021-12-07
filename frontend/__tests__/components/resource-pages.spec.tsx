import {
  getResourceDetailsPages,
  getResourceListPages,
} from '../../public/components/resource-pages';
import { isGroupVersionKind } from '../../public/module/k8s';

const isComponent = (Component) =>
  typeof Component === 'function' ||
  // connected redux component
  (typeof Component === 'object' && typeof Component.WrappedComponent === 'function');

const assertComponent = (Component, name) => {
  if (!isComponent(Component)) {
    fail(`Resource detail page ${name} promise doesn't return a react component.`);
  }
};

describe('resourceDetailsPages', () => {
  it('contains a map of promises which resolve to every resource detail view component', () => {
    getResourceDetailsPages().forEach((promise, name) => {
      expect(name.length > 0).toBe(true);
      expect(isGroupVersionKind(name)).toBe(true);

      promise()
        .then((Component) => assertComponent(Component, name))
        .catch(fail);
    });
  });
});

describe('resourceListPages', () => {
  it('contains map of promises which resolve to every resource list view component', () => {
    getResourceListPages().forEach((promise, name) => {
      expect(isGroupVersionKind(name) || name === 'ClusterServiceVersionResources').toBe(true);

      promise()
        .then((Component) => assertComponent(Component, name))
        .catch(fail);
    });
  });
});
