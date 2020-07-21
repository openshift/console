import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/internal/components/utils';
import QuickStartCatalog from '../QuickStartCatalog';
import QuickStartsPage from '../QuickStartsPage';

describe('QuickStarts', () => {
  const quickStartWrapper = shallow(<QuickStartsPage />);
  it('should load desired page heading', () => {
    expect(quickStartWrapper.find(PageHeading).exists()).toBeTruthy();
    expect(quickStartWrapper.find(PageHeading).prop('title')).toBe('Quick Starts');
  });
  it('should load a QuickStartCatalog', () => {
    expect(quickStartWrapper.find(QuickStartCatalog).exists()).toBeTruthy();
  });
});
