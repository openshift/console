import * as React from 'react';
import { shallow } from 'enzyme';
import { PageLayout } from '@console/shared';
import QuickStartCatalogPage from '../QuickStartCatalogPage';
import QuickStartCatalog from '../catalog/QuickStartCatalog';

jest.mock('../utils/useQuickStarts', () => ({
  default: jest.fn(),
}));

describe('QuickStarts', () => {
  const quickStartWrapper = shallow(<QuickStartCatalogPage />);

  it('should load page layout with desired title', () => {
    expect(quickStartWrapper.find(PageLayout).exists()).toBeTruthy();
    expect(quickStartWrapper.find(PageLayout).prop('title')).toBe('Quick Starts');
  });

  it('should load a QuickStartCatalog', () => {
    expect(quickStartWrapper.find(QuickStartCatalog).exists()).toBeTruthy();
  });
});
