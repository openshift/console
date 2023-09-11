import * as React from 'react';
import { mount } from 'enzyme';
import '@testing-library/jest-dom';
import { GettingStartedGrid } from '../GettingStartedGrid';

jest.mock('react', () => ({
  ...require.requireActual('react'),
  // Set useLayoutEffect to useEffect to solve react warning
  // "useLayoutEffect does nothing on the server, ..." while
  // running this test. useLayoutEffect was used internally by
  // the PatternFly Popover component which is used here.
  useLayoutEffect: require.requireActual('react').useEffect,
}));

describe('GettingStartedCard', () => {
  it('should render the card with title', () => {
    const wrapper = mount(<GettingStartedGrid />);
    expect(wrapper.render().text()).toContain('Getting started resources');
  });

  it('should render a dropdown option if the onHide prop is defined', () => {
    const onHide = jest.fn();
    const wrapper = mount(<GettingStartedGrid onHide={onHide} />);

    expect(wrapper.find('CardHeader')).toHaveLength(1);
    expect(wrapper.find({ 'data-test': 'actions' })).toBeTruthy();
  });
});
