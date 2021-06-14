import * as React from 'react';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import { shallow } from 'enzyme';
import { QuickStartStatus } from '../../utils/quick-start-types';
import { getQuickStarts } from '../../utils/quick-start-utils';
import QuickStartTile from '../QuickStartTile';

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
