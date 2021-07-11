import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import * as dynamicSDK from '@console/dynamic-plugin-sdk';
import CloudShellTab from '../CloudShellTab';
import CloudShellTerminal from '../CloudShellTerminal';

describe('CloudShellTab', () => {
  it('should not render redirect component if flag check is pending', () => {
    spyOn(dynamicSDK, 'useFlag').and.returnValue(undefined);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(false);
  });

  it('should render redirect component if both Devworkspaceflag and not Multicluster', () => {
    spyOn(dynamicSDK, 'useFlag').and.returnValue(false);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(true);
  });

  it('should not render CloudShellTerminal when Devworkspaceflag flags is true and Multicluster', () => {
    spyOn(dynamicSDK, 'useFlag').and.returnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera', 'clusterb'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(false);
  });

  it('should render CloudShellTerminal when Devworkspaceflag is true and not MultiCluster', () => {
    spyOn(dynamicSDK, 'useFlag').and.returnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });
});
