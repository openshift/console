import * as React from 'react';
import { shallow } from 'enzyme';
import { Button } from '@patternfly/react-core';
import { QuickStartStatus } from '../../utils/quick-start-types';
import { InternalQuickStartTileFooter as QuickStartTileFooter } from '../QuickStartTileFooter';

describe('QuickStartTileFooter', () => {
  it('should load proper footer links for completed tours', () => {
    const wrapper = shallow(
      <QuickStartTileFooter quickStartId="some-tour" status={QuickStartStatus.COMPLETE} />,
    );
    const footerButtons = wrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(1);
    expect(footerButtons.at(0).find('Review the Tour')).toBeTruthy();
  });

  it('should load proper footer links for in progress tours', () => {
    const wrapper = shallow(
      <QuickStartTileFooter quickStartId="some-tour" status={QuickStartStatus.IN_PROGRESS} />,
    );
    const footerButtons = wrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(2);
    expect(footerButtons.at(0).find('Restart the Tour')).toBeTruthy();
    expect(footerButtons.at(1).find('Resume the Tour')).toBeTruthy();
  });

  it('should load proper footer links for not started tours', () => {
    const wrapper = shallow(
      <QuickStartTileFooter quickStartId="some-tour" status={QuickStartStatus.NOT_STARTED} />,
    );
    const footerButtons = wrapper.find(Button);
    expect(footerButtons.exists()).toBeTruthy();
    expect(footerButtons.length).toEqual(1);
    expect(footerButtons.at(0).find('Start the Tour')).toBeTruthy();
  });
});
