import type { NavExtension } from '@console/dynamic-plugin-sdk';
import type { LoadedExtension } from '@console/dynamic-plugin-sdk/src/types';
import { getSortedNavExtensions } from '../utils';

const createNavItem = (
  id: string,
  insertAfter?: string | string[],
  insertBefore?: string | string[],
): LoadedExtension<NavExtension> =>
  ({
    properties: {
      id,
      ...(insertAfter !== undefined && { insertAfter }),
      ...(insertBefore !== undefined && { insertBefore }),
    },
  } as LoadedExtension<NavExtension>);

const getIds = (items: LoadedExtension<NavExtension>[]): string[] =>
  items.map((i) => i.properties.id);

describe('getSortedNavExtensions', () => {
  it('should maintain order when all insertAfter targets exist', () => {
    const items = [
      createNavItem('topology'),
      createNavItem('pods', 'topology'),
      createNavItem('deployments', 'pods'),
      createNavItem('deploymentconfigs', 'deployments'),
      createNavItem('statefulsets', ['deploymentconfigs', 'deployments']),
      createNavItem('secrets', 'statefulsets'),
    ];

    expect(getIds(getSortedNavExtensions(items))).toEqual([
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
      createNavItem('topology'),
      createNavItem('pods', 'topology'),
      createNavItem('deployments', 'pods'),
      // deploymentconfigs is absent (capability disabled)
      createNavItem('statefulsets', ['deploymentconfigs', 'deployments']),
      createNavItem('secrets', 'statefulsets'),
    ];

    expect(getIds(getSortedNavExtensions(items))).toEqual([
      'topology',
      'pods',
      'deployments',
      'statefulsets',
      'secrets',
    ]);
  });

  it('should push item to end when insertAfter target does not exist and no fallback', () => {
    const items = [
      createNavItem('topology'),
      createNavItem('pods', 'topology'),
      createNavItem('deployments', 'pods'),
      // deploymentconfigs is absent, statefulsets has no fallback
      createNavItem('statefulsets', 'deploymentconfigs'),
      createNavItem('secrets', 'statefulsets'),
    ];

    const sorted = getIds(getSortedNavExtensions(items));
    expect(sorted[0]).toBe('topology');
    expect(sorted[1]).toBe('pods');
    expect(sorted[2]).toBe('deployments');
    // statefulsets and secrets end up after deployments but order may vary
    expect(sorted).toContain('statefulsets');
    expect(sorted).toContain('secrets');
  });
});
