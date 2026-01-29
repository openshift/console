import { screen } from '@testing-library/react';
import { useParams } from 'react-router-dom-v5-compat';
import { useAccessReview } from '@console/internal/components/utils/rbac';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { ProjectDetailsPage, PageContents } from '../ProjectDetailsPage';

jest.mock('@console/internal/components/factory', () => ({
  DetailsPage: () => 'DetailsPage',
}));

jest.mock('@console/internal/components/dashboard/project-dashboard/project-dashboard', () => ({
  ProjectDashboard: () => 'ProjectDashboard',
}));

jest.mock('@console/internal/components/namespace', () => ({
  NamespaceDetails: () => 'NamespaceDetails',
  projectMenuActions: [],
}));

jest.mock('@console/internal/components/start-guide', () => ({
  withStartGuide: (Component) => Component,
}));

jest.mock('@console/internal/components/utils', () => ({
  history: { push: jest.fn() },
  useAccessReview: jest.fn(),
  Page: {},
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: jest.fn(),
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceForModel: jest.fn(),
}));

jest.mock('@console/internal/models', () => ({
  ...jest.requireActual('@console/internal/models'),
  ProjectModel: { kind: 'Project' },
  RoleBindingModel: {
    apiGroup: 'rbac.authorization.k8s.io',
    plural: 'rolebindings',
  },
  UserModel: {
    apiGroup: 'user.openshift.io',
    plural: 'users',
  },
  GroupModel: {
    apiGroup: 'user.openshift.io',
    plural: 'groups',
  },
  VolumeSnapshotContentModel: {
    apiGroup: 'snapshot.storage.k8s.io',
    plural: 'volumesnapshotcontents',
  },
}));

jest.mock('@console/shared', () => ({
  ALL_NAMESPACES_KEY: '__ALL_NAMESPACES__',
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('@console/shared/src/components/breadcrumbs/Breadcrumbs', () => ({
  Breadcrumbs: () => 'Breadcrumbs',
}));

jest.mock('../../CreateProjectListPage', () => ({
  __esModule: true,
  default: () => 'CreateProjectListPage',
  CreateAProjectButton: () => 'CreateAProjectButton',
}));

jest.mock('../../../NamespacedPage', () => ({
  __esModule: true,
  default: (props) => props.children,
  NamespacedPageVariants: { light: 'light' },
}));

jest.mock('../../../project-access/ProjectAccessPage', () => ({
  __esModule: true,
  default: () => 'ProjectAccessPage',
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: (props) => props.children,
}));

describe('ProjectDetailsPage', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('expect ProjectDetailsPage to render the project list page when in the all-projects namespace', () => {
    (useAccessReview as jest.Mock).mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({});

    renderWithProviders(<PageContents />);

    expect(screen.getByText(/CreateProjectListPage/)).toBeInTheDocument();
  });

  it('expect ProjectDetailsPage to show a namespaced details page for a namespace', () => {
    (useAccessReview as jest.Mock).mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({ ns: 'test-project' });

    renderWithProviders(<PageContents />);

    expect(screen.getByText(/DetailsPage/)).toBeInTheDocument();
  });

  it('expect ProjectDetailsPage not to render breadcrumbs', () => {
    (useAccessReview as jest.Mock).mockReturnValue(true);
    (useParams as jest.Mock).mockReturnValue({ ns: 'test-project' });

    renderWithProviders(<ProjectDetailsPage />);

    expect(screen.queryByText(/Breadcrumbs/)).not.toBeInTheDocument();
  });

  it('should render when user has no access to role bindings', () => {
    (useAccessReview as jest.Mock).mockReturnValue(false);
    (useParams as jest.Mock).mockReturnValue({ ns: 'test-project' });

    renderWithProviders(<PageContents />);

    expect(screen.getByText(/DetailsPage/)).toBeInTheDocument();
  });
});
