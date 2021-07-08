import { isNavItem } from '@console/dynamic-plugin-sdk';
import { isPerspective } from '@console/plugin-sdk';
import { testedExtensions } from '../plugin-test-utils';

describe('NavItem', () => {
  it('referring to non-existing perspective is not allowed', () => {
    const perspectiveIds = testedExtensions
      .toArray()
      .filter(isPerspective)
      .map((p) => p.properties.id);
    const navItems = testedExtensions.toArray().filter(isNavItem);
    const navItemsWithPerspective = navItems.filter((item) => !!item.properties.perspective);
    const navItemsWithoutValidPerspective = navItemsWithPerspective.filter(
      (item) => !perspectiveIds.includes(item.properties.perspective),
    );

    expect(navItemsWithoutValidPerspective).toEqual([]);
  });
});
