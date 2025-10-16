import * as React from 'react';
import { screen, cleanup } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PageContents as AddPage } from '../AddPage';
import '@testing-library/jest-dom';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared', () => {
  const originalModule = jest.requireActual('@console/shared');
  return {
    ...originalModule,
    useFlag: jest.fn<boolean>().mockReturnValue(false),
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/plugin-sdk/src/api/useExtensions', () => ({
  useExtensions: () => [],
}));

jest.mock('../../../utils/useAddActionExtensions', () => ({
  useAddActionExtensions: () => [[], true, false],
}));

jest.mock('../hooks/useAccessFilterExtensions', () => ({
  useAccessFilterExtensions: () => [[], true],
}));

jest.mock('../hooks/useShowAddCardItemDetails', () => ({
  useShowAddCardItemDetails: () => [true, jest.fn()],
}));

jest.mock(
  '@console/internal/components/dashboard/project-dashboard/getting-started/GettingStartedSection',
  () => ({
    GettingStartedSection: () => null,
  }),
);

jest.mock('@console/topology/src/components/quick-search/TopologyQuickSearch', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('@console/topology/src/components/quick-search/TopologyQuickSearchButton', () => ({
  __esModule: true,
  default: () => null,
}));

describe('AddPage', () => {
  afterEach(() => {
    cleanup();
  });

  it('should render AddCardsLoader if namespace exists', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'ns',
    });
    renderWithProviders(<AddPage />);
    expect(screen.getByTestId('add-page')).toBeInTheDocument();
  });

  it('should render CreateProjectListPage if namespace does not exist', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    renderWithProviders(<AddPage />);
    expect(screen.getByText(/select a namespace to start adding/i)).toBeInTheDocument();
  });
});
