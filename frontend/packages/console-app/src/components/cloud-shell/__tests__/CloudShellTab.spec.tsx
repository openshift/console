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
  it('should render CloudShellTerminal', () => {
    spyOn(shared, 'useFlag').and.returnValue(true);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(CloudShellTerminal).exists()).toBe(true);
  });

  it('should not render redirect component if flag check is pending', () => {
    spyOn(shared, 'useFlag').and.returnValue(undefined);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(false);
  });

  it('should render redirect component if terminal operator is not installed', () => {
    spyOn(shared, 'useFlag').and.returnValue(false);
    const cloudShellTabWrapper = shallow(<CloudShellTab />);
    expect(cloudShellTabWrapper.find(Redirect).exists()).toBe(true);
  });
});
