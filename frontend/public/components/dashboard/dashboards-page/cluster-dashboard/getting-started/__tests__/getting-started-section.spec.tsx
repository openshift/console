import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useUserSettings } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';
import { expectTextsNotInDocument } from '../../../../getting-started-test-utils';

import { GettingStartedSection } from '../getting-started-section';
import { CLUSTER_DASHBOARD_USER_SETTINGS_KEY } from '../constants';

// Mock the child card components
jest.mock('../cluster-setup-getting-started-card', () => ({
  ClusterSetupGettingStartedCard: () => 'Set up your cluster',
}));

jest.mock('../explore-admin-features-getting-started-card', () => ({
  ExploreAdminFeaturesGettingStartedCard: () => 'Explore new features',
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  GettingStartedExpandableGrid: jest.requireActual('@console/shared/src/components/getting-started')
    .GettingStartedExpandableGrid,
  GettingStartedShowState: jest.requireActual('@console/shared/src/components/getting-started')
    .GettingStartedShowState,
  useGettingStartedShowState: jest.fn(),
  QuickStartGettingStartedCard: () => 'Learn with guided tours',
}));

// Workaround because getting-started exports also RestoreGettingStartedButton
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(),
}));

const mockUserSettings = useUserSettings as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  beforeEach(() => {
    mockUserSettings.mockReset();
    useFlagMock.mockReset();
    useGettingStartedShowStateMock.mockReset();
  });

  it('should render with three child cards when all conditions are met', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
    );

    await waitFor(() => {
      const contentContainer = screen.getByTestId('getting-started-content');
      expect(contentContainer).toHaveTextContent('Set up your cluster');
      expect(contentContainer).toHaveTextContent('Learn with guided tours');
      expect(contentContainer).toHaveTextContent('Explore new features');
    });
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) returns false', async () => {
    useFlagMock.mockReturnValue(false);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
    );

    await waitFor(() => {
      expectTextsNotInDocument([
        'Set up your cluster',
        'Learn with guided tours',
        'Explore new features',
      ]);
    });
  });

  it('should render nothing if user settings hide them', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
    );

    await waitFor(() => {
      expectTextsNotInDocument([
        'Set up your cluster',
        'Learn with guided tours',
        'Explore new features',
      ]);
    });
  });

  it('should render nothing if showStateLoaded is false', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserSettings.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.SHOW,
      jest.fn(),
      false,
    ]);

    renderWithProviders(
      <GettingStartedSection userSettingKey={CLUSTER_DASHBOARD_USER_SETTINGS_KEY} />,
    );

    await waitFor(() => {
      expectTextsNotInDocument([
        'Set up your cluster',
        'Learn with guided tours',
        'Explore new features',
      ]);
    });
  });
});
