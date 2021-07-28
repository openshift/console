import * as React from 'react';
import { shallow } from 'enzyme';
import { Redirect } from 'react-router';
import * as shared from '@console/shared';
import CloudShellTab from '../CloudShellTab';
import CloudShellTerminal from '../CloudShellTerminal';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key: string) => key }),
  };
});

describe('CloudShellTab', () => {
  it('should not render redirect component if flag check is pending', () => {
    spyOn(shared, 'useFlag').and.returnValue(undefined);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(false);
  });

  it('should render redirect component if both Devworkspaceflag and not Multicluster', () => {
    spyOn(shared, 'useFlag').and.returnValue(false);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(true);
  });

  it('should not render CloudShellTerminal when Devworkspaceflag flags is true and Multicluster', () => {
    spyOn(shared, 'useFlag').and.returnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera', 'clusterb'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(false);
  });

  it('should render CloudShellTerminal when Devworkspaceflag is true and not MultiCluster', () => {
    spyOn(shared, 'useFlag').and.returnValue(true);
    window.SERVER_FLAGS.clusters = ['clustera'];
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });
});
