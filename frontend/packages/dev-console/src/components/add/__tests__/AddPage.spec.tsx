import type { ReactNode, ComponentType } from 'react';
import { screen } from '@testing-library/react';
import * as Router from 'react-router';
import { useFlag } from '@console/shared/src/hooks/useFlag';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { PageContents as AddPage } from '../AddPage';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared', () => {
  return {
    FLAGS: {
      OPENSHIFT: 'OPENSHIFT',
    },
  };
});

jest.mock('@console/shared/src/hooks/useFlag', () => ({
  useFlag: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
  Trans: ({ children }: { children: ReactNode }) => children,
  withTranslation: () => (Component: ComponentType) => Component,
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

jest.mock('../../NamespacedPage', () => ({
  __esModule: true,
  default: ({ children }) => children,
  NamespacedPageVariants: { light: 'light' },
}));

jest.mock('../../projects/CreateProjectListPage', () => ({
  __esModule: true,
  default: ({ children }) => (typeof children === 'function' ? children(jest.fn()) : children),
  CreateAProjectButton: () => null,
}));

jest.mock('../../../../../../public/components/start-guide', () => ({
  withStartGuide: (Component) => Component,
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

const useParamsMock = Router.useParams as jest.Mock;
const useFlagMock = useFlag as jest.Mock;

describe('AddPage', () => {
  beforeEach(() => {
    useFlagMock.mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render AddCardsLoader if namespace exists', () => {
    useParamsMock.mockReturnValue({
      ns: 'ns',
    });
    renderWithProviders(<AddPage />);
    expect(screen.getByTestId('add-page')).toBeInTheDocument();
  });

  it('should render CreateProjectListPage if namespace does not exist', () => {
    useParamsMock.mockReturnValue({});
    renderWithProviders(<AddPage />);
    expect(screen.getByText(/select a namespace to start adding/i)).toBeInTheDocument();
  });
});
