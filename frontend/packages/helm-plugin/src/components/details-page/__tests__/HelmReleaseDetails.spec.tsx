import * as React from 'react';
import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import * as Router from 'react-router-dom-v5-compat';
import { ErrorPage404 } from '@console/internal/components/error';
import { DetailsPage } from '@console/internal/components/factory';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import store from '@console/internal/redux';
import { mockHelmReleases } from '../../__tests__/helm-release-mock-data';
import HelmReleaseDetails, { LoadedHelmReleaseDetails } from '../HelmReleaseDetails';

let helmReleaseDetailsProps: React.ComponentProps<typeof HelmReleaseDetails>;
let loadedHelmReleaseDetailsProps: React.ComponentProps<typeof LoadedHelmReleaseDetails>;

jest.mock('react-router-dom-v5-compat', () => ({
  ...require.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

describe('HelmReleaseDetails', () => {
  beforeEach(() => {
    helmReleaseDetailsProps = {
      secrets: {
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
    };
    loadedHelmReleaseDetailsProps = {
      ...helmReleaseDetailsProps,
      helmRelease: {
        loaded: true,
        loadError: null,
        data: mockHelmReleases[0],
      },
    };

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'xyz',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '/helm-releases/ns/xyz/release/helm-mysql',
    });
  });

  it('should show the loading box if helm release data is not loaded', () => {
    loadedHelmReleaseDetailsProps.helmRelease.loaded = false;
    const helmReleaseDetails = mount(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(helmReleaseDetails.find(LoadingBox).exists()).toBe(true);
  });

  it('should show an error if helm release data could not be loaded', () => {
    loadedHelmReleaseDetailsProps.helmRelease.loadError = new Error('An error!');
    const helmReleaseDetails = mount(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(helmReleaseDetails.find(StatusBox).exists()).toBe(true);
  });

  it('should show the loading box if secret is not loaded', () => {
    loadedHelmReleaseDetailsProps.secrets.loaded = false;
    loadedHelmReleaseDetailsProps.secrets.loadError = undefined;
    const helmReleaseDetails = mount(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(helmReleaseDetails.find(LoadingBox).exists()).toBe(true);
  });

  it('should show the status box if there is an error loading the secret', () => {
    loadedHelmReleaseDetailsProps.secrets.loadError = 'error 404';
    const helmReleaseDetails = mount(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(helmReleaseDetails.find(StatusBox).exists()).toBe(true);
  });

  it('should render the DetailsPage component when secret gets loaded', () => {
    const helmReleaseDetails = mount(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(helmReleaseDetails.find(DetailsPage).exists()).toBe(true);
  });

  it('should show the ErrorPage404 for an incorrect release name in the url', () => {
    loadedHelmReleaseDetailsProps.secrets.data = [];
    const helmReleaseDetails = mount(
      <Provider store={store}>
        <BrowserRouter>
          <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
        </BrowserRouter>
      </Provider>,
    );
    expect(helmReleaseDetails.find(ErrorPage404).exists()).toBe(true);
  });
});
