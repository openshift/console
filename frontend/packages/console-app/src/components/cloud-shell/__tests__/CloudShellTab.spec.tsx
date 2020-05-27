import * as React from 'react';
import { shallow } from 'enzyme';
import CloudShellTab from '../CloudShellTab';
import CloudShellTerminal from '../CloudShellTerminal';

describe('CloudShellTab', () => {
  it('should render CloudShellTerminal', () => {
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });
});
