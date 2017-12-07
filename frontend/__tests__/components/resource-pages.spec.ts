import { resourceDetailPages, resourceListPages } from '../../public/components/resource-pages';

describe('resourceDetailPages', () => {

  it('contains key/value pairs for all resource detail view components', () => {
    resourceDetailPages.forEach((Component, name) => {
      expect(name.length > 0).toBe(true);
      expect(Component).toBeDefined();
    });
  });
});

describe('resourceListPages', () => {

  it('contains key/value pairs for all resource list view components', () => {
    resourceListPages.forEach((Component, name) => {
      expect(name.length > 0).toBe(true);
      expect(Component).toBeDefined();
    });
  });
});
