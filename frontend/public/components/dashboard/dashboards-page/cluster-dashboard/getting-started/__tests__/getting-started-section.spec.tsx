import { screen, configure, act } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useUserSettings } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';

import { GettingStartedSection } from '../getting-started-section';
import { CLUSTER_DASHBOARD_USER_SETTINGS_KEY } from '../constants';

// Mock the child card components
jest.mock('../cluster-setup-getting-started-card', () => ({
  ClusterSetupGettingStartedCard: () => 'Set up your cluster',
}));

jest.mock('../explore-admin-features-getting-started-card', () => ({
  ExploreAdminFeaturesGettingStartedCard: () => 'Explore new features',
}));

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useLayoutEffect: jest.requireActual('react').useEffect,
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  ...jest.requireActual('@console/shared/src/components/getting-started'),
  useGettingStartedShowState: jest.fn(),
  QuickStartGettingStartedCard: () => 'Learn with guided tours',
}));

// Workaround because getting-started exports also RestoreGettingStartedButton
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

// Workaround because getting-started exports also QuickStartGettingStartedCard
jest.mock(
  '@console/app/src/components/quick-starts/loader/QuickStartsLoader',
  () =>
    function QuickStartsLoaderMock({ children }) {
      return children;
    },
);

const mockUserSettings = useUserSettings as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  beforeAll(() => {
    configure({ testIdAttribute: 'data-test' });
  });

  beforeEach(() => {
    mockUserSettings.mockReset();
    useFlagMock.mockReset();
    useGettingStartedShowStateMock.mockReset();
  });

  it('should render with three child cards when all conditions are met', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
      );
    });

    const contentContainer = screen
      .getByTestId('getting-started')
      .querySelector('.ocs-getting-started-expandable-grid__content');
    expect(contentContainer).toHaveTextContent('Set up your cluster');
    expect(contentContainer).toHaveTextContent('Learn with guided tours');
    expect(contentContainer).toHaveTextContent('Explore new features');
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) returns false', async () => {
    useFlagMock.mockReturnValue(false);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
      );
    });

    expect(screen.queryByText('Set up your cluster')).not.toBeInTheDocument();
    expect(screen.queryByText('Learn with guided tours')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore new features')).not.toBeInTheDocument();
  });

  it('should render nothing if user settings hide them', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
      );
    });

    expect(screen.queryByText('Set up your cluster')).not.toBeInTheDocument();
    expect(screen.queryByText('Learn with guided tours')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore new features')).not.toBeInTheDocument();
  });

  it('should render nothing if showStateLoaded is false', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.SHOW,
      jest.fn(),
      false,
    ]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
      );
    });

    expect(screen.queryByText('Set up your cluster')).not.toBeInTheDocument();
    expect(screen.queryByText('Learn with guided tours')).not.toBeInTheDocument();
    expect(screen.queryByText('Explore new features')).not.toBeInTheDocument();
  });
});
