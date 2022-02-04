import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedGrid } from '../GettingStartedGrid';

describe('GettingStartedCard', () => {
  it('should render the card with title', () => {
    const wrapper = shallow(<GettingStartedGrid />);

    expect(wrapper.render().text()).toContain('Getting started resources');
    expect(wrapper.find('Card')).toHaveLength(1);
    expect(wrapper.find('CardHeader')).toHaveLength(1);
    expect(wrapper.find('CardBody')).toHaveLength(1);
    expect(wrapper.find('CardActions')).toHaveLength(0);
    expect(wrapper.find('Dropdown')).toHaveLength(0);
  });

  it('should render a dropdown option if the onHide prop is defined', () => {
    const onHide = jest.fn();
    const wrapper = shallow(<GettingStartedGrid onHide={onHide} />);

    expect(wrapper.find('CardActions')).toHaveLength(1);
    expect(wrapper.find('Dropdown')).toHaveLength(1);
  });
});
