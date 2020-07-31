import * as React from 'react';
import { shallow } from 'enzyme';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { getQuickStarts } from '../../utils/quick-start-utils';
import QuickStartTile from '../QuickStartTile';
import { QuickStartStatus } from '../../utils/quick-start-types';

describe('QuickStartTile', () => {
  const quickstarts = getQuickStarts();

  it('should load proper catalog tile without featured property', () => {
    const wrapper = shallow(
      <QuickStartTile
        quickStart={quickstarts[0]}
        status={QuickStartStatus.NOT_STARTED}
        onClick={jest.fn()}
        isActive={false}
      />,
    );
    const catalogTile = wrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(false);
  });

  it('should load proper catalog tile with featured property', () => {
    const wrapper = shallow(
      <QuickStartTile
        quickStart={quickstarts[1]}
        status={QuickStartStatus.IN_PROGRESS}
        onClick={jest.fn()}
        isActive
      />,
    );
    const catalogTile = wrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(true);
  });
});
