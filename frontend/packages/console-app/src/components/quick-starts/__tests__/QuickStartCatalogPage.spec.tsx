import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/internal/components/utils';
import QuickStartCatalogPage from '../QuickStartCatalogPage';
import QuickStartCatalog from '../catalog/QuickStartCatalog';

describe('QuickStarts', () => {
  const quickStartWrapper = shallow(<QuickStartCatalogPage />);

  it('should load desired page heading', () => {
    expect(quickStartWrapper.find(PageHeading).exists()).toBeTruthy();
    expect(quickStartWrapper.find(PageHeading).prop('title')).toBe('Quick Starts');
  });

  it('should load a QuickStartCatalog', () => {
    expect(quickStartWrapper.find(QuickStartCatalog).exists()).toBeTruthy();
  });
});
