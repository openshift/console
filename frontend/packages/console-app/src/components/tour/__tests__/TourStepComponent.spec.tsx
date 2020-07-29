import * as React from 'react';
import { shallow } from 'enzyme';
import TourStepComponent from '../TourStepComponent';
import { Popover } from '@console/shared';
import { Modal } from '@patternfly/react-core';
import { Spotlight } from '../Spotlight';

describe('TourStepComponent', () => {
  it('should render Modal if no selector is present', () => {
    const wrapper = shallow(<TourStepComponent heading="heading" content="content" />);
    expect(wrapper.find(Popover).exists()).toBeFalsy();
    expect(wrapper.find(Modal).exists()).toBeTruthy();
  });

  it('should render Popover with Spotlight id selector is present', () => {
    const wrapper = shallow(
      <TourStepComponent heading="heading" content="content" selector="a" step={1} />,
    );
    expect(wrapper.find(Modal).exists()).toBeFalsy();
    expect(wrapper.find(Popover).exists()).toBeTruthy();
    expect(wrapper.find(Spotlight).exists()).toBeTruthy();
  });
});
