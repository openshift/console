import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import TerminalLoadingBox from '../TerminalLoadingBox';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

const i18nNS = 'cloudshell';

describe('TerminalLoadingBox', () => {
  it('should send default message if message prop is not there', () => {
    const terminalLoadingWrapper = shallow(<TerminalLoadingBox />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual(
      `${i18nNS}~Connecting to your OpenShift command line terminal ...`,
    );
  });

  it('should forward message prop to loading box component', () => {
    const terminalLoadingWrapper = shallow(<TerminalLoadingBox message="test" />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual('test');
  });
});
