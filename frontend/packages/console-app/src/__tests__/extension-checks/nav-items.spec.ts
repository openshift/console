import { useExtensions } from '@openshift/dynamic-plugin-sdk';
import { isNavItem, isPerspective } from '@console/dynamic-plugin-sdk';
import { renderHookWithProviders } from '@console/shared/src/test-utils/unit-test-utils';

describe('NavItem', () => {
  it('referring to non-existing perspective is not allowed', async () => {
    const { result: perspectives } = renderHookWithProviders(() => useExtensions(isPerspective));
    const { result: navItems } = renderHookWithProviders(() => useExtensions(isNavItem));

    const perspectiveIds = perspectives.current.map((p) => p.properties.id);
    const navItemsWithPerspective = navItems.current.filter(
      (item) => !!item.properties.perspective,
    );
    const navItemsWithoutValidPerspective = navItemsWithPerspective.filter(
      (item) => !perspectiveIds.includes(item.properties.perspective),
    );

    expect(navItemsWithoutValidPerspective).toEqual([]);
  });
});
