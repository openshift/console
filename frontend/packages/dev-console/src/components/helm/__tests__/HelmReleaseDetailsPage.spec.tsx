import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import NamespacedPage from '../../NamespacedPage';
import HelmReleaseDetails from '../details/HelmReleaseDetails';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

type Component = typeof HelmReleaseDetailsPage;
type Props = React.ComponentProps<Component>;
let helmReleaseDetailsProps: Props;
let helmReleaseDetailsPage: ShallowWrapper<Props>;

describe('HelmReleaseDetailsPage', () => {
  beforeEach(() => {
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

    helmReleaseDetailsPage = shallow(<HelmReleaseDetailsPage {...helmReleaseDetailsProps} />);
  });

  it('should render the NamespaceBar component', () => {
    expect(helmReleaseDetailsPage.find(NamespacedPage).exists()).toBe(true);
  });
  it('should render the HelmReleaseDetails component', () => {
    expect(helmReleaseDetailsPage.find(HelmReleaseDetails).exists()).toBe(true);
  });
});
