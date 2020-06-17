import * as React from 'react';
import { shallow } from 'enzyme';
import { CatalogTile } from '@patternfly/react-catalog-view-extension';
import GuidedTourItem from '../GuidedTourItem';
import { getGuidedToursWithStatus } from '../utils/guided-tour-utils';

describe('GuidedTourItem', () => {
  const tourItems = getGuidedToursWithStatus();

  it('should load proper catalog tile without featured property', () => {
    const guidedTourItemWrapper = shallow(<GuidedTourItem {...tourItems[0]} />);
    const catalogTile = guidedTourItemWrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(false);
  });
  it('should load proper catalog tile with featured property', () => {
    const guidedTourItemWrapper = shallow(<GuidedTourItem {...tourItems[1]} />);
    const catalogTile = guidedTourItemWrapper.find(CatalogTile);
    expect(catalogTile.exists()).toBeTruthy();
    expect(catalogTile.prop('featured')).toBe(true);
  });
});
