import * as _ from 'lodash';
import { isDashboardsOverviewUtilizationItem } from '@console/plugin-sdk';
import { testedExtensions } from '../plugin-test-utils';

describe('DashboardsOverviewUtilizationItem', () => {
  it('duplicate ids are not allowed', () => {
    const items = testedExtensions.toArray().filter(isDashboardsOverviewUtilizationItem);
    const dedupedItems = _.uniqWith(items, (a, b) => a.properties.id === b.properties.id);
    const duplicateItems = _.difference(items, dedupedItems);

    expect(duplicateItems).toEqual([]);
  });
});
