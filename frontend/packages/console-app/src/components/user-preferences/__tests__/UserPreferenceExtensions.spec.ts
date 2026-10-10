import { join } from 'path';
import { UserPreferenceFieldType } from '@console/dynamic-plugin-sdk/src/extensions/user-preferences';
import { parseJSONC } from '@console/dynamic-plugin-sdk/src/utils/jsonc';
import { orderExtensionBasedOnInsertBeforeAndAfter } from '@console/shared/src/utils/order-extensions';
import type { ResolvedUserPreferenceItem } from '../types';
import { getUserPreferenceGroups } from '../utils/getUserPreferenceGroups';

type RegisteredPreferenceItem = ResolvedUserPreferenceItem & {
  field: ResolvedUserPreferenceItem['field'] & {
    component?: { $codeRef?: string };
  };
};

describe('console-app user preference extensions', () => {
  it('should register one combined Theme before Perspective and retain contributed items', () => {
    const extensionPath = join(process.cwd(), 'packages/console-app/console-extensions.json');
    const extensions = parseJSONC<
      {
        type: string;
        properties: RegisteredPreferenceItem;
      }[]
    >(extensionPath);
    const registeredItems = extensions
      .filter(({ type }) => type === 'console.user-preference/item')
      .map(({ properties }) => properties);
    const themeItems = registeredItems.filter(({ id }) => id === 'console.theme');
    const perspective = registeredItems.find(({ id }) => id === 'console.preferredPerspective');

    expect(themeItems).toHaveLength(1);
    expect(themeItems[0]).toMatchObject({
      groupId: 'general',
      field: {
        type: 'custom',
        component: { $codeRef: 'ThemeSelector' },
      },
    });
    expect(registeredItems.some(({ id }) => id === 'console.theme/contrast')).toBe(false);
    expect(perspective).toMatchObject({ insertAfter: 'console.theme' });

    const contributedItem: ResolvedUserPreferenceItem = {
      id: 'example.plugin.preference',
      groupId: 'general',
      label: 'Example plugin preference',
      description: '',
      field: {
        type: UserPreferenceFieldType.custom,
        component: () => null,
      },
      insertAfter: 'console.preferredPerspective',
    };
    const generalItems = registeredItems.filter(({ groupId }) => groupId === 'general');
    const sortedItems = orderExtensionBasedOnInsertBeforeAndAfter<ResolvedUserPreferenceItem>([
      ...(generalItems as ResolvedUserPreferenceItem[]),
      contributedItem,
    ]);
    const [generalGroup] = getUserPreferenceGroups(
      [{ id: 'general', label: 'General' }],
      sortedItems,
    );
    const orderedIds = generalGroup.items.map(({ id }) => id);

    expect(orderedIds.indexOf('console.theme')).toBeLessThan(
      orderedIds.indexOf('console.preferredPerspective'),
    );
    expect(orderedIds.indexOf('console.preferredPerspective')).toBeLessThan(
      orderedIds.indexOf('example.plugin.preference'),
    );
    expect(orderedIds).toContain('example.plugin.preference');
  });
});
