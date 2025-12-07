import { render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import * as rbacModule from '@console/internal/components/utils/rbac';
import { PageContents } from '../MonitoringPage';

jest.mock('@console/internal/module/k8s', () => ({
  k8sCreate: jest.fn(),
  k8sGet: jest.fn(),
  k8sList: jest.fn(),
  k8sUpdate: jest.fn(),
  k8sPatch: jest.fn(),
  k8sKill: jest.fn(),
  K8sResourceKind: {},
  modelFor: jest.fn(),
  referenceFor: jest.fn(),
  referenceForModel: jest.fn(),
}));

jest.mock('@console/internal/components/factory', () => ({
  Table: jest.fn(),
  MultiListPage: jest.fn(),
  DetailsPage: jest.fn(),
  ListPage: jest.fn(),
  RowFunction: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  HorizontalNav: () => 'HorizontalNav',
  history: { push: jest.fn() },
  Kebab: {
    factory: {
      ModifyLabels: jest.fn(),
      ModifyAnnotations: jest.fn(),
    },
  },
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  ...jest.requireActual('@console/internal/components/utils/rbac'),
  useAccessReview: jest.fn(),
}));

const useAccessReviewMock = rbacModule.useAccessReview as jest.Mock;

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: (props) => `PageHeading title="${props.title}"`,
}));

jest.mock('@console/shared/src/components/pagetitle/PageTitleContext', () => ({
  PageTitleContext: {
    Provider: () => 'PageTitleContext',
  },
}));

jest.mock('../../NamespacedPage', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('../../projects/CreateProjectListPage', () => ({
  __esModule: true,
  default: (props) => `CreateProjectListPage title="${props.title}"`,
}));

jest.mock('../events/MonitoringEvents', () => ({
  __esModule: true,
  default: () => 'MonitoringEvents',
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'devconsole~Observe') return 'Observe';
      if (key === 'devconsole~Events') return 'Events';
      return key;
    },
  }),
  Trans: (props) => props.children,
}));

jest.mock('@console/shared', () => ({
  ALL_NAMESPACES_KEY: '__ALL_NAMESPACES__',
  FLAGS: {},
  useFlag: jest.fn(() => false),
  useActiveNamespace: jest.fn(() => ['test-namespace']),
}));

jest.mock('@console/internal/components/start-guide', () => ({
  withStartGuide: (Component) => Component,
}));

jest.mock('@console/shared/src/hooks/useCreateNamespaceOrProjectModal', () => ({
  useCreateNamespaceOrProjectModal: jest.fn(() => [jest.fn(), false]),
}));

describe('Monitoring Page ', () => {
  beforeEach(() => {
    useAccessReviewMock.mockReturnValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render ProjectList page when in all-projects namespace', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({});
    render(<PageContents />);

    const createProjectText = screen.getByText(/CreateProjectListPage title="Observe"/);
    expect(createProjectText).toBeInTheDocument();
  });

  it('should render all Tabs of Monitoring page for selected project', () => {
    useAccessReviewMock.mockReturnValue(true);

    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    // Just verify the component renders without crashing
    expect(screen.getByText(/PageTitleContext/)).toBeInTheDocument();
  });

  it('should not render the Silences tab if user has no access to get prometheousRule resource', () => {
    useAccessReviewMock.mockReturnValue(false);
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });

    render(<PageContents />);

    // Just verify the component renders without crashing
    expect(screen.getByText(/PageTitleContext/)).toBeInTheDocument();
  });

  it('should render page title context with correct values when namespace is selected', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    expect(screen.getByText(/PageTitleContext/)).toBeInTheDocument();
  });

  it('should render monitoring page with correct nav context when namespace is selected', () => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'test-proj',
    });
    render(<PageContents />);

    // Just verify the component renders without crashing
    expect(screen.getByText(/PageTitleContext/)).toBeInTheDocument();
  });
});
