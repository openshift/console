import { screen } from '@testing-library/react';
import * as Router from 'react-router';
import { usePreferredCreateEditMethod } from '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import BuildConfigFormPage from '../BuildConfigFormPage';
import type { BuildConfig } from '../types';

jest.mock('react-helmet-async', () => ({
  Helmet: () => null,
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

// For internal used Dropdowns
jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: () => ['', () => {}, true],
}));

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: () => {},
}));

jest.mock('../sections/EditorField', () =>
  jest.requireActual('@console/shared/src/components/formik-fields/TextAreaField'),
);

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(),
  }),
);

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
}));

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useUserPreferenceMock = useUserPreference as jest.Mock;
const usePreferredCreateEditMethodMock = usePreferredCreateEditMethod as jest.Mock;

beforeEach(() => {
  useUserPreferenceMock.mockReturnValue([undefined, jest.fn(), true]);
  usePreferredCreateEditMethodMock.mockReturnValue([undefined, true]);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('BuildConfigFormPage', () => {
  it('should fetch BuildConfig and render loading until BuildConfig is loaded', () => {
    useK8sWatchResourceMock.mockReturnValue([null, false, '']);

    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'a-namespace', name: 'a-buildconfig' });

    renderWithProviders(<BuildConfigFormPage />);
    expect(screen.queryByText('Create BuildConfig')).toBeFalsy();
    expect(screen.queryByText('Edit BuildConfig')).toBeFalsy();
    expect(screen.getByTestId('loading-indicator')).toBeVisible();

    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'BuildConfig',
      namespace: 'a-namespace',
      name: 'a-buildconfig',
    });
  });

  it('should fetch BuildConfig and render edit form when BuildConfig is loaded', async () => {
    const watchedBuildConfig: BuildConfig = {
      apiVersion: 'build.openshift.io/v1',
      kind: 'BuildConfig',
      metadata: {
        namespace: 'a-namespace',
        name: 'a-buildconfig',
        resourceVersion: '1',
      },
      spec: {},
    };
    useK8sWatchResourceMock.mockReturnValue([watchedBuildConfig, true, '']);

    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'a-namespace', name: 'a-buildconfig' });

    renderWithProviders(<BuildConfigFormPage />);
    expect(screen.queryByText('Create BuildConfig')).toBeFalsy();
    expect(await screen.findByText('Edit BuildConfig')).toBeVisible();
    expect(await screen.findByText('Configure via:')).toBeVisible();
    expect(await screen.findByText('Form view')).toBeVisible();
    expect(await screen.findByText('YAML view')).toBeVisible();
    expect(await screen.findByRole('button', { name: 'Save' })).toBeVisible();

    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'BuildConfig',
      namespace: 'a-namespace',
      name: 'a-buildconfig',
    });
  });

  it('should render an error when the BuildConfig fetching fails', async () => {
    useK8sWatchResourceMock.mockReturnValue([null, true, new Error('Something went wrong')]);

    jest.spyOn(Router, 'useParams').mockReturnValue({ ns: 'a-namespace', name: 'a-buildconfig' });

    renderWithProviders(<BuildConfigFormPage />);
    expect(await screen.findByText(/Error loading/i)).toBeVisible();
    expect(await screen.findByText('Something went wrong')).toBeVisible();
  });
});
