import * as React from 'react';
import { shallow } from 'enzyme';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import HelmReleaseDetailsPage, { LoadedHelmReleaseDetailsPage } from '../HelmReleaseDetailsPage';
import { mockHelmReleases } from './helm-release-mock-data';

let helmReleaseDetailsPageProps: React.ComponentProps<typeof HelmReleaseDetailsPage>;
let loadedHelmReleaseDetailsPageProps: React.ComponentProps<typeof LoadedHelmReleaseDetailsPage>;

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
    loadedHelmReleaseDetailsPageProps = {
      ...helmReleaseDetailsPageProps,
      helmReleaseData: mockHelmReleases[0],
    };
  });
  it('should show the loading box if helm release data is not loaded', () => {
    loadedHelmReleaseDetailsPageProps.helmReleaseData = null;
    const helmReleaseDetailsPage = shallow(
      <LoadedHelmReleaseDetailsPage {...loadedHelmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(LoadingBox).exists()).toBe(true);
  });
  it('should show the loading box if secret is not loaded', () => {
    loadedHelmReleaseDetailsPageProps.secret.loaded = false;
    loadedHelmReleaseDetailsPageProps.secret.loadError = undefined;
    const helmReleaseDetailsPage = shallow(
      <LoadedHelmReleaseDetailsPage {...loadedHelmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(LoadingBox).exists()).toBe(true);
  });
  it('should show the status box if there is an error loading the secret', () => {
    loadedHelmReleaseDetailsPageProps.secret.loadError = 'error 404';
    const helmReleaseDetailsPage = shallow(
      <LoadedHelmReleaseDetailsPage {...loadedHelmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(StatusBox).exists()).toBe(true);
  });
  it('should render the DetailsPage component when secret gets loaded', () => {
    const helmReleaseDetailsPage = shallow(
      <LoadedHelmReleaseDetailsPage {...loadedHelmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(DetailsPage).exists()).toBe(true);
  });
  it('should show the ErrorPage404 for an incorrect release name in the url', () => {
    loadedHelmReleaseDetailsPageProps.secret.data = [];
    const helmReleaseDetailsPage = shallow(
      <LoadedHelmReleaseDetailsPage {...loadedHelmReleaseDetailsPageProps} />,
    );
    expect(helmReleaseDetailsPage.find(ErrorPage404).exists()).toBe(true);
  });
});
