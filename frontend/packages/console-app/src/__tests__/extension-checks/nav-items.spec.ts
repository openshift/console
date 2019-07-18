import { isNavItem, isPerspective } from '@console/plugin-sdk';
import { testedPluginStore } from '../plugin-test-utils';

describe('NavItem', () => {
  it('referring to non-existing perspective is not allowed', () => {
    const perspectiveIds = testedPluginStore
      .getAllExtensions()
      .filter(isPerspective)
      .map((p) => p.properties.id);
    const navItems = testedPluginStore.getAllExtensions().filter(isNavItem);
    const navItemsWithPerspective = navItems.filter((item) => !!item.properties.perspective);
    const navItemsWithoutValidPerspective = navItemsWithPerspective.filter(
      (item) => !perspectiveIds.includes(item.properties.perspective),
    );

    expect(navItemsWithoutValidPerspective).toEqual([]);
  });
});
