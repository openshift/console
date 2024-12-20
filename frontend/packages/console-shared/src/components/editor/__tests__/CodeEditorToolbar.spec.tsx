import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useDispatch } from 'react-redux';
import { ActionType } from '@console/internal/reducers/ols';
import { useOLSConfig } from '../../../hooks/ols-hook';
import CodeEditorToolbar from '../CodeEditorToolbar';
import ShortcutsLink from '../ShortcutsLink';

jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
}));

jest.mock('../../../hooks/ols-hook', () => ({
  useOLSConfig: jest.fn(),
}));

describe('CodeEditorToolbar', () => {
  let wrapper: ShallowWrapper;
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useTranslation as jest.Mock).mockReturnValue({ t: (key: string) => key });
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
  });

  it('should render null when showShortcuts is false and toolbarLinks is empty', () => {
    wrapper = shallow(<CodeEditorToolbar />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });

  it('should render toolbar with shortcuts when showShortcuts is true', () => {
    wrapper = shallow(<CodeEditorToolbar showShortcuts />);
    expect(wrapper.find(ShortcutsLink).exists()).toBe(true);
  });

  it('should render toolbar with custom links when toolbarLinks are provided', () => {
    const toolbarLinks = [<div key="custom">Custom Link</div>];
    wrapper = shallow(<CodeEditorToolbar toolbarLinks={toolbarLinks} />);
    expect(wrapper.contains(<div>Custom Link</div>)).toBe(true);
  });

  it('should render "Ask OpenShift Lightspeed" button when showLightspeedButton is true', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(true);
    wrapper = shallow(<CodeEditorToolbar showShortcuts />);
    expect(wrapper.find(Button).prop('children')).toBe('console-shared~Ask OpenShift Lightspeed');
  });

  it('should not render "Ask OpenShift Lightspeed" button when showLightspeedButton is false', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(false);
    wrapper = shallow(<CodeEditorToolbar showShortcuts />);
    expect(wrapper.find(Button).exists()).toBe(false);
  });

  it('should dispatch OpenOLS action when "Ask OpenShift Lightspeed" button is clicked', () => {
    (useOLSConfig as jest.Mock).mockReturnValue(true);
    wrapper = shallow(<CodeEditorToolbar showShortcuts />);
    wrapper.find(Button).simulate('click');
    expect(mockDispatch).toHaveBeenCalledWith({ type: ActionType.OpenOLS });
  });
});
