import * as UIActions from '../ui';

describe('ui-actions', () => {
  describe('UIActions.formatNamespaceRoute', () => {
    it('formats namespaced routes', () => {
      [
        ['bar', '/k8s/ns/foo/pods', '/k8s/ns/bar/pods'],
        ['bar', '/search/ns/foo', '/search/ns/bar'],
        ['bar', '/status/ns/foo', '/status/ns/bar'],
        ['bar', '/k8s/all-namespaces/foo', '/k8s/ns/bar/foo'],
        ['bar', '/k8s/ns/foo/bar/baz', '/k8s/ns/bar/bar'],
      ].forEach((t) => {
        expect(UIActions.formatNamespaceRoute(t[0], t[1])).toEqual(t[2]);
      });
    });

    it('removes page query param when namespace changes', () => {
      const location = { search: '?page=2&perPage=50', hash: '' };
      expect(UIActions.formatNamespaceRoute('bar', '/k8s/ns/foo/pods', location)).toEqual(
        '/k8s/ns/bar/pods?perPage=50',
      );
    });

    it('removes page query param when switching from all-namespaces', () => {
      const location = { search: '?page=2&perPage=50', hash: '' };
      expect(UIActions.formatNamespaceRoute('bar', '/k8s/all-namespaces/pods', location)).toEqual(
        '/k8s/ns/bar/pods?perPage=50',
      );
    });

    it('preserves all query params when namespace does not change', () => {
      const location = { search: '?page=2&perPage=50&sortBy=Name', hash: '' };
      expect(UIActions.formatNamespaceRoute('foo', '/k8s/ns/foo/pods', location)).toEqual(
        '/k8s/ns/foo/pods?page=2&perPage=50&sortBy=Name',
      );
    });

    it('preserves hash when removing page param', () => {
      const location = { search: '?page=2&perPage=50', hash: '#section' };
      expect(UIActions.formatNamespaceRoute('bar', '/k8s/ns/foo/pods', location)).toEqual(
        '/k8s/ns/bar/pods?perPage=50#section',
      );
    });

    it('handles empty query string after removing page param', () => {
      const location = { search: '?page=2', hash: '' };
      expect(UIActions.formatNamespaceRoute('bar', '/k8s/ns/foo/pods', location)).toEqual(
        '/k8s/ns/bar/pods',
      );
    });
  });
});
