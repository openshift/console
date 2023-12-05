import * as React from 'react';
import { shallow } from 'enzyme';
import { Navigate } from 'react-router-dom-v5-compat';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import CloudShellTab from '../CloudShellTab';
import MultiTabTerminal from '../MultiTabbedTerminal';

describe('CloudShellTab', () => {
  it('should not render redirect component if flag check is pending', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(undefined);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Navigate).exists()).toBe(false);
  });

  it('should render redirect component if both Devworkspaceflag and not Multicluster', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(false);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Navigate).exists()).toBe(true);
  });

  it('should render CloudShellTerminal when Devworkspaceflag is true and not MultiCluster', () => {
    spyOn(flagsModule, 'useFlag').and.returnValue(true);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(MultiTabTerminal).exists()).toBe(true);
  });
});
