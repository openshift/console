import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';
import { expectTextsNotInDocument } from '../../../../getting-started-test-utils';

import { GettingStartedSection } from '../getting-started-section';
import { CLUSTER_DASHBOARD_USER_PREFERENCE_KEY } from '../constants';

// Mock the child card components
jest.mock('../cluster-setup-getting-started-card', () => ({
  ClusterSetupGettingStartedCard: () => 'Set up your cluster',
}));

jest.mock('../explore-admin-features-getting-started-card', () => ({
  ExploreAdminFeaturesGettingStartedCard: () => 'Explore new features',
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useFlag'),
  useFlag: jest.fn<boolean, []>(),
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
jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(),
}));

const mockUserPreference = useUserPreference as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  beforeEach(() => {
    mockUserPreference.mockReset();
    useFlagMock.mockReset();
    useGettingStartedShowStateMock.mockReset();
  });

  it('should render with three child cards when all conditions are met', async () => {
    useFlagMock.mockReturnValue(true);
    mockUserPreference.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey={CLUSTER_DASHBOARD_USER_PREFERENCE_KEY} />,
    );

    const contentContainer = await screen.findByTestId('getting-started-content');
    expect(contentContainer).toHaveTextContent('Set up your cluster');
    expect(contentContainer).toHaveTextContent('Learn with guided tours');
    expect(contentContainer).toHaveTextContent('Explore new features');
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) returns false', async () => {
    useFlagMock.mockReturnValue(false);
    mockUserPreference.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey={CLUSTER_DASHBOARD_USER_PREFERENCE_KEY} />,
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
    mockUserPreference.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey={CLUSTER_DASHBOARD_USER_PREFERENCE_KEY} />,
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
    mockUserPreference.mockReturnValue([true, jest.fn()]);
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.SHOW,
      jest.fn(),
      false,
    ]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey={CLUSTER_DASHBOARD_USER_PREFERENCE_KEY} />,
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
