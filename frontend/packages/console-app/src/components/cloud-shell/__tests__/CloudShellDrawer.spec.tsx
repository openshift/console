import * as React from 'react';
import { shallow } from 'enzyme';
import { Drawer } from '@console/shared';
import CloseButton from '@console/shared/src/components/close-button';
import CloudShellDrawer from '../CloudShellDrawer';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const i18nNS = 'console-app';

describe('CloudShellDrawerComponent', () => {
  it('should render children as Drawer children when present', () => {
    const wrapper = shallow(
      <CloudShellDrawer onClose={() => null}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    expect(
      wrapper
        .find(Drawer)
        .children()
        .html(),
    ).toEqual('<p>Terminal content</p>');
  });

  it('should call onClose when clicked on close button', () => {
    const onClose = jest.fn();
    const wrapper = shallow(
      <CloudShellDrawer onClose={onClose}>
        <p>Terminal content</p>
      </CloudShellDrawer>,
    );
    const closeButton = wrapper
      .find(Drawer)
      .shallow()
      .find(CloseButton);
    expect(closeButton.props().ariaLabel).toEqual(`${i18nNS}~Close terminal`);
    closeButton.simulate('click');
    expect(onClose).toHaveBeenCalled();
  });
});
