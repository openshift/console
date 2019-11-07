import * as _ from 'lodash';
import { testedRegistry } from '../plugin-test-utils';

describe('DashboardsOverviewUtilizationItem', () => {
  it('duplicate ids are not allowed', () => {
    const items = testedRegistry.getDashboardsOverviewUtilizationItems();
    const dedupedItems = _.uniqWith(items, (a, b) => a.properties.id === b.properties.id);
    const duplicateItems = _.difference(items, dedupedItems);

    expect(duplicateItems).toEqual([]);
  });
});
