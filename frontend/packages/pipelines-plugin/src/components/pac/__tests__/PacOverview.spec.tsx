import * as React from 'react';
import { Alert, Hint } from '@patternfly/react-core';
import { shallow, ShallowWrapper } from 'enzyme';
import { sampleSecretData } from '../../../test-data/pac-data';
import PacOverview from '../PacOverview';

jest.mock('../hooks/usePacGHManifest', () => ({
  usePacGHManifest: jest.fn(),
}));

type PacOverviewProps = React.ComponentProps<typeof PacOverview>;

describe('PacForm', () => {
  let wrapper: ShallowWrapper<PacOverviewProps>;
  let pacOverviewProps: PacOverviewProps;

  beforeEach(() => {
    pacOverviewProps = {
      namespace: 'openshift-pipelines',
      secret: sampleSecretData,
    };
  });

  it('should show success alert if first flow and secret exists', () => {
    wrapper = shallow(<PacOverview {...pacOverviewProps} showSuccessAlert />);
    const alertDangerVariant = wrapper.find(Alert);
    expect(alertDangerVariant.exists()).toBe(true);
    expect(alertDangerVariant).toHaveLength(1);
    expect(alertDangerVariant.props().variant).toEqual('success');
  });

  it('should not show success alert if not first flow and secret exists', () => {
    wrapper = shallow(<PacOverview {...pacOverviewProps} />);
    const alertDangerVariant = wrapper.find(Alert);
    expect(alertDangerVariant).toHaveLength(0);
  });

  it('should show hint if not first flow and secret exists', () => {
    wrapper = shallow(<PacOverview {...pacOverviewProps} />);
    expect(wrapper.find(Hint).exists()).toBe(true);
  });

  it('should not show hint if first flow', () => {
    wrapper = shallow(<PacOverview {...pacOverviewProps} showSuccessAlert />);
    expect(wrapper.find(Hint)).toHaveLength(0);
  });

  it('should show danger alert if there is error', () => {
    const updatedPacOverviewProps: PacOverviewProps = {
      ...pacOverviewProps,
      loadError: new Error('error'),
    };
    wrapper = shallow(<PacOverview {...updatedPacOverviewProps} />);
    const alertDangerVariant = wrapper.find(Alert);
    expect(alertDangerVariant.exists()).toBe(true);
    expect(alertDangerVariant).toHaveLength(1);
    expect(alertDangerVariant.props().variant).toEqual('danger');
  });

  it('should show danger alert if secret doesnot exists', () => {
    // mockUsePacGHManifest.mockReturnValue({ loaded: false, manifestData: {} });
    const updatedPacOverviewProps: PacOverviewProps = {
      ...pacOverviewProps,
      secret: undefined,
    };
    wrapper = shallow(<PacOverview {...updatedPacOverviewProps} />);
    const alertDangerVariant = wrapper.find(Alert);
    expect(alertDangerVariant.exists()).toBe(true);
    expect(alertDangerVariant).toHaveLength(1);
    expect(alertDangerVariant.props().variant).toEqual('danger');
  });
});
