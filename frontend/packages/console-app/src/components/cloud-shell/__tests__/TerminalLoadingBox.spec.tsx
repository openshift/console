import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import TerminalLoadingBox from '../TerminalLoadingBox';

describe('TerminalLoadingBox', () => {
  it('should render cloudshellterminal', () => {
    const terminalLoadingWrapper: ShallowWrapper = shallow(<TerminalLoadingBox />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual(
      'Connecting to your OpenShift command line terminal ...',
    );
  });
  it('should render cloudshellterminal', () => {
    const terminalLoadingWrapper: ShallowWrapper = shallow(<TerminalLoadingBox message="test" />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual('test');
  });
});
