import { testedRegistry } from '../plugin-test-utils';

describe('NavItem', () => {
  it('referring to non-existing perspective is not allowed', () => {
    const perspectiveIds = testedRegistry.getPerspectives().map((p) => p.properties.id);
    const navItems = testedRegistry.getNavItems();
    const navItemsWithPerspective = navItems.filter((item) => !!item.properties.perspective);
    const navItemsWithoutValidPerspective = navItemsWithPerspective.filter(
      (item) => !perspectiveIds.includes(item.properties.perspective),
    );

    expect(navItemsWithoutValidPerspective).toEqual([]);
  });
});
