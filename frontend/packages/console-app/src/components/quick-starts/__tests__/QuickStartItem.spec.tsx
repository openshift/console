import * as React from 'react';
import { shallow } from 'enzyme';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import QuickStartItem from '../QuickStartItem';
import { getQuickStartsWithStatus } from '../utils/quick-start-utils';

describe('QuickStartItem', () => {
  const quickstarts = getQuickStartsWithStatus();

  it('should load proper catalog tile without featured property', () => {
    const QuickStartItemWrapper = shallow(
      <QuickStartItem {...quickstarts[0]} onClick={jest.fn()} />,
    );
    const catalogTile = QuickStartItemWrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(false);
  });
  it('should load proper catalog tile with featured property', () => {
    const QuickStartItemWrapper = shallow(
      <QuickStartItem {...quickstarts[1]} onClick={jest.fn()} />,
    );
    const catalogTile = QuickStartItemWrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(true);
  });
});
