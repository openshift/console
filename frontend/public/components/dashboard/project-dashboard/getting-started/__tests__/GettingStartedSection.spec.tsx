import { screen } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { useUserPreference } from '@console/shared/src/hooks/useUserPreference';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import {
  GettingStartedShowState,
  useGettingStartedShowState,
} from '@console/shared/src/components/getting-started';
import { expectTextsNotInDocument } from '../../../getting-started-test-utils';

import { GettingStartedSection } from '../GettingStartedSection';

jest.mock('../SampleGettingStartedCard', () => ({
  SampleGettingStartedCard: () => 'Sample getting started',
}));

jest.mock('../DeveloperFeaturesGettingStartedCard', () => ({
  DeveloperFeaturesGettingStartedCard: () => 'Developer features',
}));

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useFlag'),
  useFlag: jest.fn<boolean, []>(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  ...jest.requireActual('@console/shared/src/hooks/useUserPreference'),
  useUserPreference: jest.fn(() => [true, jest.fn()]),
}));

jest.mock('@console/shared/src/components/getting-started', () => ({
  ...jest.requireActual('@console/shared/src/components/getting-started'),
  useGettingStartedShowState: jest.fn(),
  QuickStartGettingStartedCard: () => 'Quick start tutorials',
}));

const mockUserPreference = useUserPreference as jest.Mock;
const useFlagMock = useFlag as jest.Mock;
const useGettingStartedShowStateMock = useGettingStartedShowState as jest.Mock;

describe('GettingStartedSection', () => {
  beforeEach(() => {
    mockUserPreference.mockReset();
    useFlagMock.mockReset();
    useGettingStartedShowStateMock.mockReset();

    // Default mock setup for most tests
    mockUserPreference.mockReturnValue([true, jest.fn()]);
    useFlagMock.mockReturnValue(true);
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.SHOW, jest.fn(), true]);
  });

  it('should render with three child cards when all conditions are met', () => {
    renderWithProviders(
      <GettingStartedSection userPreferenceKey="console.projectOverview.gettingStarted" />,
    );

    // Check that all three cards are present by looking for their mocked components
    const contentContainer = screen.getByTestId('getting-started-content');
    expect(contentContainer).toHaveTextContent('Sample getting started');
    expect(contentContainer).toHaveTextContent('Quick start tutorials');
    expect(contentContainer).toHaveTextContent('Developer features');
  });

  it('should render nothing when useFlag(FLAGS.OPENSHIFT) returns false', () => {
    useFlagMock.mockReturnValue(false);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey="console.projectOverview.gettingStarted" />,
    );

    expectTextsNotInDocument([
      'Sample getting started',
      'Quick start tutorials',
      'Developer features',
    ]);
  });

  it('should render nothing if user settings hide them', () => {
    useGettingStartedShowStateMock.mockReturnValue([GettingStartedShowState.HIDE, jest.fn(), true]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey="console.projectOverview.gettingStarted" />,
    );

    expectTextsNotInDocument([
      'Sample getting started',
      'Quick start tutorials',
      'Developer features',
    ]);
  });

  it('should render nothing if showStateLoaded is false', () => {
    useGettingStartedShowStateMock.mockReturnValue([
      GettingStartedShowState.SHOW,
      jest.fn(),
      false,
    ]);

    renderWithProviders(
      <GettingStartedSection userPreferenceKey="console.projectOverview.gettingStarted" />,
    );

    expectTextsNotInDocument([
      'Sample getting started',
      'Quick start tutorials',
      'Developer features',
    ]);
  });
});
