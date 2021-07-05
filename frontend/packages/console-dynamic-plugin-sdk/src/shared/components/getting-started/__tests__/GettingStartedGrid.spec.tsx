import * as React from 'react';
import { shallow } from 'enzyme';
import { GettingStartedGrid } from '../GettingStartedGrid';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  // Set useLayoutEffect to useEffect to solve react warning
  // "useLayoutEffect does nothing on the server, ..." while
  // running this test. useLayoutEffect was used internally by
  // the PatternFly Popover component which is used here.
  useLayoutEffect: require.requireActual('react').useEffect,
}));

jest.mock('react-i18next', () => ({
  ...require.requireActual('react-i18next'),
  useTranslation: () => ({ t: (key) => key.split('~')[1] }),
}));

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
