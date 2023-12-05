import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import NamespacedPage from '@console/dev-console/src/components/NamespacedPage';
import HelmReleaseDetails from '../HelmReleaseDetails';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

let helmReleaseDetailsPage: ShallowWrapper;

describe('HelmReleaseDetailsPage', () => {
  beforeEach(() => {
    helmReleaseDetailsPage = shallow(<HelmReleaseDetailsPage />);
  });

  it('should render the NamespaceBar component', () => {
    expect(helmReleaseDetailsPage.find(NamespacedPage).exists()).toBe(true);
  });
  it('should render the HelmReleaseDetails component', () => {
    expect(helmReleaseDetailsPage.find(HelmReleaseDetails).exists()).toBe(true);
  });
});
