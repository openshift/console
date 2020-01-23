import * as React from 'react';
import { shallow } from 'enzyme';
import { NamespaceBar } from '@console/internal/components/namespace';
import HelmReleaseDetails from '../HelmReleaseDetails';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

let helmReleaseDetailsProps: React.ComponentProps<typeof HelmReleaseDetails>;

describe('HelmReleaseDetails', () => {
  helmReleaseDetailsProps = {
    match: {
      url: '/helm-releases/ns/xyz/release/helm-mysql',
      isExact: false,
      path: '/helm-releases/ns/xyz/release/:name',
      params: {
        ns: 'xyz',
      },
    },
  };
  const helmReleaseDetails = shallow(<HelmReleaseDetails {...helmReleaseDetailsProps} />);
  it('should render the NamespaceBar component', () => {
    expect(helmReleaseDetails.find(NamespaceBar).exists()).toBe(true);
  });
  it('should render the HelmReleaseDetailsPage component', () => {
    expect(helmReleaseDetails.find(HelmReleaseDetailsPage).exists()).toBe(true);
  });
});
