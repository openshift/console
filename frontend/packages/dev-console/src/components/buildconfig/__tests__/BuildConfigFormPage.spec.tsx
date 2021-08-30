import * as React from 'react';
import { configure, render, cleanup } from '@testing-library/react';
import { Provider } from 'react-redux';
import { usePreferredCreateEditMethod } from '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import store from '@console/internal/redux';
import { useUserSettings } from '@console/shared/src';
import BuildConfigFormPage, { BuildConfigFormPageProps } from '../BuildConfigFormPage';
import { BuildConfig } from '../types';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: jest.fn(),
}));

// For internal used Dropdowns
jest.mock('@console/shared/src/hooks/useUserSettingsCompatibility', () => ({
  useUserSettingsCompatibility: () => ['', () => {}],
}));

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: () => {},
}));

jest.mock('../sections/EditorField', () =>
  require.requireActual('@console/shared/src/components/formik-fields/TextAreaField'),
);

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(),
  }),
);

const useK8sWatchResourceMock = useK8sWatchResource as jest.Mock;
const useUserSettingsMock = useUserSettings as jest.Mock;
const usePreferredCreateEditMethodMock = usePreferredCreateEditMethod as jest.Mock;

const Wrapper: React.FC<{}> = ({ children }) => <Provider store={store}>{children}</Provider>;

configure({ testIdAttribute: 'data-test' });

beforeEach(() => {
  useUserSettingsMock.mockReturnValue([undefined, jest.fn(), true]);
  usePreferredCreateEditMethodMock.mockReturnValue([[undefined, true]]);
});

afterEach(() => {
  jest.resetAllMocks();
  cleanup();
});

describe('BuildConfigFormPage', () => {
  it('should not fetch when creating a new BuildConfig (url contains name ~new)', async () => {
    useK8sWatchResourceMock.mockReturnValue([null, true, '']);

    const props = {
      match: { params: { ns: 'a-namespace', name: '~new' } },
    } as BuildConfigFormPageProps;

    const renderResult = render(
      <Wrapper>
        <BuildConfigFormPage {...props} />
      </Wrapper>,
    );
    renderResult.findByText('Create BuildConfig');
    expect(renderResult.queryByText('Edit BuildConfig')).toBeFalsy();
    renderResult.findByText('Configure via:');
    renderResult.findByText('Form view');
    renderResult.findByText('YAML view');
    renderResult.findByRole('button', { name: /Submit/ });

    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith(null);
  });

  it('should fetch BuildConfig and render loading until BuildConfig is loaded', () => {
    useK8sWatchResourceMock.mockReturnValue([null, false, '']);

    const props = {
      match: { params: { ns: 'a-namespace', name: 'a-buildconfig' } },
    } as BuildConfigFormPageProps;

    const renderResult = render(
      <Wrapper>
        <BuildConfigFormPage {...props} />
      </Wrapper>,
    );
    expect(renderResult.queryByText('Create BuildConfig')).toBeFalsy();
    expect(renderResult.queryByText('Edit BuildConfig')).toBeFalsy();
    renderResult.getByTestId('loading-indicator');

    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'BuildConfig',
      namespace: 'a-namespace',
      name: 'a-buildconfig',
    });
  });

  it('should fetch BuildConfig and render edit form when BuildConfig is loaded', () => {
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

    const props = {
      match: { params: { ns: 'a-namespace', name: 'a-buildconfig' } },
    } as BuildConfigFormPageProps;

    const renderResult = render(
      <Wrapper>
        <BuildConfigFormPage {...props} />
      </Wrapper>,
    );
    expect(renderResult.queryByText('Create BuildConfig')).toBeFalsy();
    renderResult.findByText('Edit BuildConfig');
    renderResult.findByText('Configure via:');
    renderResult.findByText('Form view');
    renderResult.findByText('YAML view');
    renderResult.findByRole('button', { name: /Submit/ });

    expect(useK8sWatchResourceMock).toHaveBeenCalledTimes(1);
    expect(useK8sWatchResourceMock).toHaveBeenCalledWith({
      kind: 'BuildConfig',
      namespace: 'a-namespace',
      name: 'a-buildconfig',
    });
  });

  it('should render an error when the BuildConfig fetching fails', () => {
    useK8sWatchResourceMock.mockReturnValue([null, true, new Error('Something went wrong')]);

    const props = {
      match: { params: { ns: 'a-namespace', name: 'a-buildconfig' } },
    } as BuildConfigFormPageProps;

    const renderResult = render(
      <Wrapper>
        <BuildConfigFormPage {...props} />
      </Wrapper>,
    );
    renderResult.findByText('Error Loading');
    renderResult.findByText('Edit BuildConfig');
    renderResult.findByText('Something went wrong');
  });
});
