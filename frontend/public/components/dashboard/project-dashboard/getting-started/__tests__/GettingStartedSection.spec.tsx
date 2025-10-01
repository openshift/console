import { screen, configure, act } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useUserSettings } from '@console/shared';
import { useFlag } from '@console/shared/src/hooks/flag';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';

import { GettingStartedSection } from '../GettingStartedSection';

jest.mock('../SampleGettingStartedCard', () => ({
  SampleGettingStartedCard: () => 'Sample getting started',
}));

jest.mock('../DeveloperFeaturesGettingStartedCard', () => ({
  DeveloperFeaturesGettingStartedCard: () => 'Developer features',
}));

jest.mock('@console/shared/src/hooks/flag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/flag'),
  useFlag: jest.fn(),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  ...jest.requireActual('@console/shared/src/components/getting-started'),
  useGettingStartedShowState: jest.fn(),
  QuickStartGettingStartedCard: () => 'Quick start tutorials',
}));

// Workaround because getting-started exports also useGettingStartedShowState
jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(() => [true, jest.fn(), false]),
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

    mockUserSettings.mockReturnValue([true, jest.fn(), false]);
  });

  it('should render with three child cards when all conditions are met', async () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
      );
    });

    // Check that all three cards are present by looking for their mocked components
    const contentContainer = screen
      .getByTestId('getting-started')
      .querySelector('.ocs-getting-started-expandable-grid__content');
    expect(contentContainer).toHaveTextContent('Sample getting started');
    expect(contentContainer).toHaveTextContent('Quick start tutorials');
    expect(contentContainer).toHaveTextContent('Developer features');
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) returns false', async () => {
    useFlagMock.mockReturnValue(false);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
      );
    });

    expect(screen.queryByText('Sample getting started')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick start tutorials')).not.toBeInTheDocument();
    expect(screen.queryByText('Developer features')).not.toBeInTheDocument();
  });

  it('should render nothing if user settings hide them', async () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
      );
    });

    expect(screen.queryByText('Sample getting started')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick start tutorials')).not.toBeInTheDocument();
    expect(screen.queryByText('Developer features')).not.toBeInTheDocument();
  });

  it('should render nothing if showStateLoaded is false', async () => {
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.SHOW,
      jest.fn(),
      false,
    ]);

    await act(async () => {
      renderWithProviders(
        <GettingStartedSection userSettingKey="console.projectOverview.gettingStarted" />,
      );
    });

    expect(screen.queryByText('Sample getting started')).not.toBeInTheDocument();
    expect(screen.queryByText('Quick start tutorials')).not.toBeInTheDocument();
    expect(screen.queryByText('Developer features')).not.toBeInTheDocument();
  });
});
