import { screen, act } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { useResolvedExtensions } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { useQueryParams } from '@console/shared/src';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import UserPreferencePage from '../UserPreferencePage';
import {
  mockUserPreferenceGroupExtensions,
  mockUserPreferenceItemExtensions,
} from './userPreferences.data';

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: () => null,
}));

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  Spotlight: () => null,
}));

jest.mock('@console/internal/components/utils/status-box', () => ({
  LoadingBox: () => 'Loading...',
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: jest.fn(),
}));

jest.mock('@console/dynamic-plugin-sdk/src/api/useResolvedExtensions', () => ({
  useResolvedExtensions: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useQueryParams', () => ({
  useQueryParams: jest.fn(),
}));

const useExtensionsMock = useExtensions as jest.Mock;
const useResolvedExtensionsMock = useResolvedExtensions as jest.Mock;
const useQueryParamsMock = useQueryParams as jest.Mock;
const useParamsMock = Router.useParams as jest.Mock;

describe('UserPreferencePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default user preference group based on the url params', async () => {
    useParamsMock.mockReturnValue({
      group: 'language',
    });
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    await act(async () => {
      renderWithProviders(<UserPreferencePage />);
    });

    expect(screen.getByRole('tab', { name: /Language/ })).toBeVisible();
  });

  it('should render with "general" user preference group as default when URL has no group param', async () => {
    useParamsMock.mockReturnValue({});
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, true]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    await act(async () => {
      renderWithProviders(<UserPreferencePage />);
    });

    expect(screen.getByRole('tab', { name: /General/ })).toBeVisible();
  });

  it('should render loading state when user preference extensions have not resolved', async () => {
    useParamsMock.mockReturnValue({});
    useExtensionsMock.mockReturnValue(mockUserPreferenceGroupExtensions);
    useResolvedExtensionsMock.mockReturnValue([mockUserPreferenceItemExtensions, false]);
    useQueryParamsMock.mockReturnValue(new URLSearchParams());

    await act(async () => {
      renderWithProviders(<UserPreferencePage />);
    });

    expect(screen.getByText('Loading...')).toBeVisible();
    expect(screen.queryByRole('tab', { name: /General/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Language/ })).not.toBeInTheDocument();
  });
});
