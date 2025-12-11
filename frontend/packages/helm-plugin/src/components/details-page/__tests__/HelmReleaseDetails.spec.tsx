import * as React from 'react';
import { screen, render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as Router from 'react-router-dom-v5-compat';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockHelmReleases } from '../../__tests__/helm-release-mock-data';
import HelmReleaseDetails, { LoadedHelmReleaseDetails } from '../HelmReleaseDetails';

let helmReleaseDetailsProps: React.ComponentProps<typeof HelmReleaseDetails>;
let loadedHelmReleaseDetailsProps: React.ComponentProps<typeof LoadedHelmReleaseDetails>;

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(() => ({ pathname: '', location: '' })),
  useNavigate: jest.fn(),
}));

// jest mock useClusterVersion
jest.mock('@console/shared/src/hooks/version', () => ({
  useClusterVersion: jest.fn(),
}));

jest.mock('@console/internal/components/utils/firehose', () => ({
  ...jest.requireActual('@console/internal/components/utils/firehose'),
  Firehose: ({ children }) => children,
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
      search: '',
      state: null,
      hash: '',
      key: 'default',
    });
  });

  it('should show the loading box if helm release data is not loaded', () => {
    loadedHelmReleaseDetailsProps.helmRelease.loaded = false;
    render(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('loading-box')).toBeTruthy();
  });

  it('should show an error if helm release data could not be loaded', () => {
    loadedHelmReleaseDetailsProps.helmRelease.loadError = new Error('An error!');
    render(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('console-empty-state')).toBeTruthy();
  });

  it('should show the loading box if secret is not loaded', () => {
    loadedHelmReleaseDetailsProps.secrets.loaded = false;
    loadedHelmReleaseDetailsProps.secrets.loadError = undefined;
    render(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('loading-box')).toBeTruthy();
  });

  it('should show the status box if there is an error loading the secret', () => {
    loadedHelmReleaseDetailsProps.secrets.loadError = 'error 404';
    render(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(screen.getByTestId('console-empty-state')).toBeTruthy();
  });

  it('should render the DetailsPage component when secret gets loaded', () => {
    renderWithProviders(<LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />);
    expect(screen.getByText(loadedHelmReleaseDetailsProps.helmRelease.data.name)).toBeTruthy();
    expect(screen.getByText('Details')).toBeTruthy();
    expect(screen.getByText('Resources')).toBeTruthy();
    expect(screen.getByText('Release notes')).toBeTruthy();
    expect(screen.getByText('Revision history')).toBeTruthy();
  });

  it('should show the ErrorPage404 for an incorrect release name in the url', () => {
    loadedHelmReleaseDetailsProps.secrets.data = [];
    renderWithProviders(
      <BrowserRouter>
        <LoadedHelmReleaseDetails {...loadedHelmReleaseDetailsProps} />
      </BrowserRouter>,
    );
    expect(screen.getByText('404: Page Not Found')).toBeTruthy();
    expect(screen.getByText('Page Not Found (404)')).toBeTruthy();
  });
});
