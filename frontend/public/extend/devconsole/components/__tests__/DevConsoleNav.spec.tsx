/* eslint-disable no-unused-vars */
import * as React from 'react';
import { shallow } from 'enzyme';
import { PageSidebar } from '@patternfly/react-core';
import { DevConsoleNavigation, PageNav } from '../DevConsoleNav';

function shallowSetup() {
  const props = {
    location: '/devops',
    isNavOpen: true,
    onNavSelect: () => {},
    onToggle: () => {},
  };

  const navWrapper = shallow(<DevConsoleNavigation {...props} />);

  return {
    navWrapper,
    props,
  };
}

describe('DevConsole Navigation', () => {
  it('renders `DevConsoleNavigation` component using the given props', () => {
    const { navWrapper, props } = shallowSetup();
    expect(navWrapper.exists()).toBe(true);
    expect(navWrapper.find(PageSidebar).exists());
    expect(navWrapper.find(PageSidebar).length).toEqual(1);
    expect(navWrapper.find(PageSidebar).prop('isNavOpen')).toEqual(true);
    expect(
      navWrapper
        .find(PageSidebar)
        .dive()
        .find(PageNav)
        .prop('onToggle'),
    ).toEqual(props.onToggle);
    expect(
      navWrapper
        .find(PageSidebar)
        .dive()
        .find(PageNav)
        .prop('onNavSelect'),
    ).toEqual(props.onNavSelect);
  });

  it('allows us to set Props', () => {
    const { navWrapper } = shallowSetup();
    expect(navWrapper.find(PageSidebar).props().isNavOpen).toEqual(true);
    navWrapper.setProps({
      isNavOpen: false,
    });
    expect(navWrapper.find(PageSidebar).props().isNavOpen).toEqual(false);
    expect(
      navWrapper
        .find(PageSidebar)
        .dive()
        .find(PageNav)
        .props().location,
    ).toEqual('/devops');
    navWrapper.setProps({
      location: '/devops/codebases',
    });
    expect(
      navWrapper
        .find(PageSidebar)
        .dive()
        .find(PageNav)
        .props().location,
    ).toEqual('/devops/codebases');
  });
});
