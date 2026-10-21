import type { NavExtension, K8sModel } from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import {
  getSortedNavExtensions,
  sortExtensionItems,
  stripScopeFromPath,
  navItemHrefIsActive,
  navItemResourceIsActive,
  isTopLevelNavItem,
} from '../utils';

const createNavExtension = (
  id: string,
  overrides: Partial<NavExtension['properties']> = {},
): LoadedExtension<NavExtension> =>
  ({
    type: 'console.navigation/href',
    uid: `uid-${id}`,
    properties: {
      id,
      name: `Nav ${id}`,
      href: `/${id}`,
      ...overrides,
    },
  } as LoadedExtension<NavExtension>);

const createNavSection = (
  id: string,
  overrides: Partial<NavExtension['properties']> = {},
): LoadedExtension<NavExtension> =>
  ({
    type: 'console.navigation/section',
    uid: `uid-${id}`,
    properties: {
      id,
      name: `Section ${id}`,
      ...overrides,
    },
  } as LoadedExtension<NavExtension>);

describe('utils', () => {
  describe('stripScopeFromPath', () => {
    it('should strip k8s/cluster/ prefix from path', () => {
      expect(stripScopeFromPath('/k8s/cluster/nodes')).toBe('nodes');
    });

    it('should strip k8s/ns/<namespace>/ prefix from path', () => {
      expect(stripScopeFromPath('/k8s/ns/default/pods')).toBe('pods');
    });

    it('should strip k8s/all-namespaces/ prefix from path', () => {
      expect(stripScopeFromPath('/k8s/all-namespaces/deployments')).toBe('deployments');
    });

    it('should handle paths without k8s scope', () => {
      expect(stripScopeFromPath('/monitoring/alerts')).toBe('monitoring/alerts');
    });

    it('should handle trailing slashes', () => {
      expect(stripScopeFromPath('/k8s/cluster/nodes/')).toBe('nodes');
    });

    it('should handle complex namespace names', () => {
      expect(stripScopeFromPath('/k8s/ns/my-project-123/configmaps')).toBe('configmaps');
    });
  });

  describe('navItemHrefIsActive', () => {
    it('should return true when location matches href exactly', () => {
      expect(navItemHrefIsActive('/k8s/cluster/nodes', '/k8s/cluster/nodes')).toBe(true);
    });

    it('should return true when location starts with href segments', () => {
      expect(navItemHrefIsActive('/k8s/cluster/nodes/node-1', '/k8s/cluster/nodes')).toBe(true);
    });

    it('should return false when location does not match href', () => {
      expect(navItemHrefIsActive('/k8s/cluster/pods', '/k8s/cluster/nodes')).toBe(false);
    });

    it('should return true when location matches startsWith array', () => {
      expect(navItemHrefIsActive('/monitoring/alerts', '/monitoring', ['monitoring/alerts'])).toBe(
        true,
      );
    });

    it('should handle namespaced paths correctly', () => {
      expect(navItemHrefIsActive('/k8s/ns/default/pods', '/k8s/ns/test/pods')).toBe(true);
    });

    it('should return false when startsWith does not match', () => {
      expect(navItemHrefIsActive('/other/path', '/monitoring', ['monitoring/alerts'])).toBe(false);
    });
  });

  describe('navItemResourceIsActive', () => {
    const mockK8sModel: K8sModel = {
      apiVersion: 'v1',
      apiGroup: '',
      kind: 'Pod',
      label: 'Pod',
      labelPlural: 'Pods',
      plural: 'pods',
      abbr: 'P',
      namespaced: true,
    };

    it('should return true when location matches model plural', () => {
      expect(navItemResourceIsActive('/k8s/ns/default/pods', mockK8sModel)).toBe(true);
    });

    it('should return false when location does not match model', () => {
      expect(navItemResourceIsActive('/k8s/ns/default/deployments', mockK8sModel)).toBe(false);
    });

    it('should return true when location matches startsWith', () => {
      expect(navItemResourceIsActive('/workloads/pods', mockK8sModel, ['workloads'])).toBe(true);
    });

    it('should return false when model is undefined', () => {
      expect(navItemResourceIsActive('/k8s/ns/default/pods', undefined)).toBe(false);
    });

    it('should handle cluster-scoped resources', () => {
      const clusterModel: K8sModel = {
        apiVersion: 'v1',
        apiGroup: '',
        kind: 'Node',
        label: 'Node',
        labelPlural: 'Nodes',
        plural: 'nodes',
        abbr: 'N',
        namespaced: false,
      };
      expect(navItemResourceIsActive('/k8s/cluster/nodes', clusterModel)).toBe(true);
    });
  });

  describe('getSortedNavExtensions', () => {
    it('should return items in original order when no positioning specified', () => {
      const items = [createNavExtension('a'), createNavExtension('b'), createNavExtension('c')];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual(['a', 'b', 'c']);
    });

    it('should position item before another using insertBefore', () => {
      const items = [
        createNavExtension('a'),
        createNavExtension('b'),
        createNavExtension('c', { insertBefore: 'a' }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual(['c', 'a', 'b']);
    });

    it('should position item after another using insertAfter', () => {
      const items = [
        createNavExtension('a'),
        createNavExtension('b'),
        createNavExtension('c', { insertAfter: 'a' }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual(['a', 'c', 'b']);
    });

    it('should handle insertBefore with array of targets', () => {
      const items = [
        createNavExtension('a'),
        createNavExtension('b'),
        createNavExtension('c', { insertBefore: ['nonexistent', 'b'] }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual(['a', 'c', 'b']);
    });

    it('should handle insertAfter with array of targets', () => {
      const items = [
        createNavExtension('a'),
        createNavExtension('b'),
        createNavExtension('c', { insertAfter: ['nonexistent', 'a'] }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual(['a', 'c', 'b']);
    });

    it('should handle circular dependencies gracefully', () => {
      const items = [
        createNavExtension('a', { insertAfter: 'b' }),
        createNavExtension('b', { insertAfter: 'a' }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted).toHaveLength(2);
      expect(sorted.map((i) => i.properties.id)).toContain('a');
      expect(sorted.map((i) => i.properties.id)).toContain('b');
    });

    it('should maintain order when all insertAfter targets exist in workloads scenario', () => {
      const items = [
        createNavExtension('topology'),
        createNavExtension('pods', { insertAfter: 'topology' }),
        createNavExtension('deployments', { insertAfter: 'pods' }),
        createNavExtension('deploymentconfigs', { insertAfter: 'deployments' }),
        createNavExtension('statefulsets', { insertAfter: ['deploymentconfigs', 'deployments'] }),
        createNavExtension('secrets', { insertAfter: 'statefulsets' }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual([
        'topology',
        'pods',
        'deployments',
        'deploymentconfigs',
        'statefulsets',
        'secrets',
      ]);
    });

    it('should use fallback insertAfter target when primary target is missing', () => {
      const items = [
        createNavExtension('topology'),
        createNavExtension('pods', { insertAfter: 'topology' }),
        createNavExtension('deployments', { insertAfter: 'pods' }),
        createNavExtension('statefulsets', { insertAfter: ['deploymentconfigs', 'deployments'] }),
        createNavExtension('secrets', { insertAfter: 'statefulsets' }),
      ];

      const sorted = getSortedNavExtensions(items);

      expect(sorted.map((i) => i.properties.id)).toEqual([
        'topology',
        'pods',
        'deployments',
        'statefulsets',
        'secrets',
      ]);
    });

    it('should push item to end when insertAfter target does not exist and no fallback', () => {
      const items = [
        createNavExtension('topology'),
        createNavExtension('pods', { insertAfter: 'topology' }),
        createNavExtension('deployments', { insertAfter: 'pods' }),
        createNavExtension('statefulsets', { insertAfter: 'deploymentconfigs' }),
        createNavExtension('secrets', { insertAfter: 'statefulsets' }),
      ];

      const sorted = getSortedNavExtensions(items);
      expect(sorted[0].properties.id).toBe('topology');
      expect(sorted[1].properties.id).toBe('pods');
      expect(sorted[2].properties.id).toBe('deployments');
      expect(sorted.map((i) => i.properties.id)).toContain('statefulsets');
      expect(sorted.map((i) => i.properties.id)).toContain('secrets');
    });
  });

  describe('sortExtensionItems', () => {
    it('should return empty array for empty input', () => {
      expect(sortExtensionItems([])).toEqual([]);
    });

    it('should return single item unchanged', () => {
      const items = [createNavExtension('a')];
      const sorted = sortExtensionItems(items);
      expect(sorted.map((i) => i.properties.id)).toEqual(['a']);
    });

    it('should sort items based on dependencies', () => {
      const items = [
        createNavExtension('c', { insertAfter: 'b' }),
        createNavExtension('a'),
        createNavExtension('b', { insertAfter: 'a' }),
      ];

      const sorted = sortExtensionItems(items);

      const aIndex = sorted.findIndex((i) => i.properties.id === 'a');
      const bIndex = sorted.findIndex((i) => i.properties.id === 'b');
      const cIndex = sorted.findIndex((i) => i.properties.id === 'c');

      expect(aIndex).toBeLessThan(bIndex);
      expect(bIndex).toBeLessThan(cIndex);
    });

    it('should handle items with no dependencies first', () => {
      const items = [createNavExtension('b', { insertAfter: 'a' }), createNavExtension('a')];

      const sorted = sortExtensionItems(items);

      expect(sorted[0].properties.id).toBe('a');
    });
  });

  describe('isTopLevelNavItem', () => {
    it('should return true for nav sections', () => {
      const section = createNavSection('home');
      expect(isTopLevelNavItem(section)).toBe(true);
    });

    it('should return true for items without section property', () => {
      const item = createNavExtension('dashboard');
      expect(isTopLevelNavItem(item)).toBe(true);
    });

    it('should return false for items with section property', () => {
      const item = createNavExtension('pods', { section: 'workloads' });
      expect(isTopLevelNavItem(item)).toBe(false);
    });
  });
});
