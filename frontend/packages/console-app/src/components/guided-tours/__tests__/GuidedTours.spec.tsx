import * as React from 'react';
import { shallow } from 'enzyme';
import { PageHeading } from '@console/internal/components/utils';
import GuidedTourCatalog from '../GuidedTourCatalog';
import GuidedTours from '../GuidedTours';

describe('GuidedTours', () => {
  const guidedTousWrapper = shallow(<GuidedTours />);
  it('should load desired page heading', () => {
    expect(guidedTousWrapper.find(PageHeading).exists()).toBeTruthy();
    expect(guidedTousWrapper.find(PageHeading).prop('title')).toBe('Guided Tours');
  });
  it('should load a GuidedTourCatalog', () => {
    expect(guidedTousWrapper.find(GuidedTourCatalog).exists()).toBeTruthy();
  });
});
