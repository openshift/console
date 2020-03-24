import * as React from 'react';
import { shallow } from 'enzyme';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import HelmReleaseDetailsPage from '../HelmReleaseDetailsPage';

let helmReleaseDetailsPageProps: React.ComponentProps<typeof HelmReleaseDetailsPage>;

describe('HelmReleaseDetailsPage', () => {
  beforeEach(() => {
    helmReleaseDetailsPageProps = {
      secret: {
        data: [
          {
            metadata: {
              name: 'secret-name',
              namespace: 'xyz',
              creationTimestamp: '2020-01-13T05:42:19Z',
              labels: {
                name: 'helm-mysql',
                owner: 'helm',
                status: 'deployed',
              },
            },
          },
        ],
        loadError: null,
        loaded: true,
      },
      match: {
        params: {
          ns: 'xyz',
        },
        url: '/helm-releases/ns/xyz/release/helm-mysql',
        isExact: true,
        path: '/helm-releases/ns/xyz/release/:name',
      },
    };
  });
  it('should show the loading box if secret is not loaded', () => {
    helmReleaseDetailsPageProps.secret.loaded = false;
    helmReleaseDetailsPageProps.secret.loadError = undefined;
    const helmReleaseDetailsPage = shallow(
      <HelmReleaseDetailsPage {...helmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(LoadingBox).exists()).toBe(true);
  });
  it('should show the status box if there is an error loading the secret', () => {
    helmReleaseDetailsPageProps.secret.loadError = 'error 404';
    const helmReleaseDetailsPage = shallow(
      <HelmReleaseDetailsPage {...helmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(StatusBox).exists()).toBe(true);
  });
  it('should render the DetailsPage component when secret gets loaded', () => {
    const helmReleaseDetailsPage = shallow(
      <HelmReleaseDetailsPage {...helmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(DetailsPage).exists()).toBe(true);
  });
  it('should show the ErrorPage404 for an incorrect release name in the url', () => {
    helmReleaseDetailsPageProps.secret.data = [];
    const helmReleaseDetailsPage = shallow(
      <HelmReleaseDetailsPage {...helmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(ErrorPage404).exists()).toBe(true);
  });
});
