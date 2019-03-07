/* eslint-disable no-unused-vars */
import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import PerspectiveSwitcher from '../PerspectiveSwitcher';
import { Modal } from '@patternfly/react-core';

describe('PerspectiveSwitcher', () => {
  let switcherWrapper: ShallowWrapper<any> = null;

  it('renders perspective switcher menu and it should be closed initially', () => {
    switcherWrapper = shallow(
      <PerspectiveSwitcher
        isNavOpen={false}
        onNavToggle={() => {}}
      />
    );
    expect(switcherWrapper.find(Modal).length).toEqual(1);
    expect(switcherWrapper.find(Modal).prop('isOpen')).toEqual(false);
  });

  it('should be open when is isNavOpen is set to true', () => {
    switcherWrapper = shallow(
      <PerspectiveSwitcher
        isNavOpen={true}
        onNavToggle={() => {}}
      />
    );
    expect(switcherWrapper.find(Modal).prop('isOpen')).toEqual(true);
  });
});

