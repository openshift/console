import * as React from 'react';
import { shallow } from 'enzyme';
import { GuidedTourStatus } from '../utils/guided-tour-status';
import { Button } from '@patternfly/react-core';
import TourItemFooter from '../TourItemFooter';

describe('TourItemFooter', () => {
  it('should load proper footer links for completed tours', () => {
    const TourItemFooterWrapper = shallow(<TourItemFooter status={GuidedTourStatus.COMPLETE} />);
    const footerButtons = TourItemFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(1);
    expect(footerButtons.at(0).find('Review the Tour')).toBeTruthy();
  });
  it('should load proper footer links for in progress tours', () => {
    const TourItemFooterWrapper = shallow(<TourItemFooter status={GuidedTourStatus.IN_PROGRESS} />);
    const footerButtons = TourItemFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(2);
    expect(footerButtons.at(0).find('Restart the Tour')).toBeTruthy();
    expect(footerButtons.at(1).find('Resume the Tour')).toBeTruthy();
  });
  it('should load proper footer links for not started tours', () => {
    const TourItemFooterWrapper = shallow(<TourItemFooter status={GuidedTourStatus.NOT_STARTED} />);
    const footerButtons = TourItemFooterWrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(1);
    expect(footerButtons.at(0).find('Start the Tour')).toBeTruthy();
  });
});
