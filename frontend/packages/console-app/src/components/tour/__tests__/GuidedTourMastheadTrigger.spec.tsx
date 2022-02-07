import React from 'react';
import { shallow } from 'enzyme';
import GuidedTourMastheadTrigger from '../GuidedTourMastheadTrigger';

describe('GuidedTourMastheadTrigger', () => {
  it('should render button when tour is available', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({ tour: { steps: [] } });
    const wrapper = shallow(<GuidedTourMastheadTrigger />);
    expect(wrapper.find('button').exists()).toBeTruthy();
  });

  it('should render null when tour is not available', () => {
    jest.spyOn(React, 'useContext').mockReturnValue({ tour: null });
    const wrapper = shallow(<GuidedTourMastheadTrigger />);
    expect(wrapper.isEmptyRender()).toBeTruthy();
  });
});
