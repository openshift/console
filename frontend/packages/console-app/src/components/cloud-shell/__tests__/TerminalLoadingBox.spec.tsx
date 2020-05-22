import * as React from 'react';
import { shallow } from 'enzyme';
import { LoadingBox } from '@console/internal/components/utils/status-box';
import TerminalLoadingBox from '../TerminalLoadingBox';

describe('TerminalLoadingBox', () => {
  it('should send default message if message prop is not there', () => {
    const terminalLoadingWrapper = shallow(<TerminalLoadingBox />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual(
      'Connecting to your OpenShift command line terminal ...',
    );
  });

  it('should forward message prop to loading box component', () => {
    const terminalLoadingWrapper = shallow(<TerminalLoadingBox message="test" />);
    const loadingBox = terminalLoadingWrapper.find(LoadingBox);
    expect(loadingBox.exists()).toBe(true);
    expect(loadingBox.prop('message')).toEqual('test');
  });
});
