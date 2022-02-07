import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import * as shared from '@console/shared/src/hooks/flag';
import CloudShellTab from '../CloudShellTab';
import CloudShellTerminal from '../CloudShellTerminal';

describe('CloudShellTab', () => {
  it('should not render redirect component if flag check is pending', () => {
    jest.spyOn(shared, 'useFlag').mockReturnValue(undefined);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(false);
  });

  it('should render redirect component if both Devworkspaceflag and not Multicluster', () => {
    jest.spyOn(shared, 'useFlag').mockReturnValue(false);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(true);
  });

  it('should not render CloudShellTerminal when Devworkspaceflag flags is true and Multicluster', () => {
    jest.spyOn(shared, 'useFlag').mockReturnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera', 'clusterb'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(false);
  });

  it('should render CloudShellTerminal when Devworkspaceflag is true and not MultiCluster', () => {
    jest.spyOn(shared, 'useFlag').mockReturnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });
});
