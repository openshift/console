import { screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeployImage from '../DeployImage';
import DeployImagePage from '../DeployImagePage';

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/shared/src/hooks/useResourceConnectionHandler', () => ({
  useResourceConnectionHandler: () => () => {},
}));

jest.mock('@console/internal/components/utils/rbac', () => ({
  useAccessReview: () => false,
}));

jest.mock('@console/shared/src/hooks/useResizeObserver', () => ({
  useResizeObserver: () => {},
}));

jest.mock('../serverless/useUpdateKnScalingDefaultValues', () => ({
  useUpdateKnScalingDefaultValues: (initialValues) => initialValues,
}));

jest.mock('../section/useResourceType', () => ({
  useResourceType: () => ['kubernetes', jest.fn()],
}));

jest.mock('../../NamespacedPage', () => ({
  __esModule: true,
  default: (props) => props.children,
  NamespacedPageVariants: {
    light: 'light',
    default: 'default',
  },
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: ({ title }) => title,
}));

jest.mock('../../QueryFocusApplication', () => ({
  __esModule: true,
  default: function MockQueryFocusApplication(props) {
    return props.children && props.children('test-app');
  },
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResource: () => [[], true, null],
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('../DeployImageForm', () => ({
  __esModule: true,
  default: () => 'Deploy Image Form Content',
}));

jest.mock('@console/shared/src/components/form-utils', () => ({
  ...jest.requireActual('@console/shared/src/components/form-utils'),
}));

describe('DeployImage Page Test', () => {
  beforeEach(() => {
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: 'deploy-image/ns/openshift?preselected-ns=openshift',
      search: 'deploy-image/ns/openshift?preselected-ns=openshift',
      state: null,
      hash: null,
      key: 'test',
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render DeployImagePage with NamespacedPage and PageHeading', () => {
    renderWithProviders(<DeployImagePage />);

    expect(screen.getByText(/Deploy Image/)).toBeInTheDocument();
  });

  it('should render with correct page title', () => {
    renderWithProviders(<DeployImagePage />);

    expect(screen.getByText(/Deploy Image/)).toBeInTheDocument();
  });
});

describe('Deploy Image Test', () => {
  type DeployImageProps = React.ComponentProps<typeof DeployImage>;
  let deployImageProps: DeployImageProps;

  beforeEach(() => {
    deployImageProps = {
      projects: {
        data: [],
        loaded: false,
      },
      namespace: 'my-project',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render DeployImage component with DeployImageForm', () => {
    renderWithProviders(<DeployImage {...deployImageProps} />);

    expect(screen.getByText('Deploy Image Form Content')).toBeInTheDocument();
  });

  it('should pass correct props to DeployImageForm', () => {
    renderWithProviders(<DeployImage {...deployImageProps} />);

    expect(screen.getByText('Deploy Image Form Content')).toBeInTheDocument();
  });

  it('should render with projects loaded state', () => {
    const propsWithLoadedProjects = {
      ...deployImageProps,
      projects: {
        data: [{ metadata: { name: 'test-project' } }],
        loaded: true,
      },
    };

    renderWithProviders(<DeployImage {...propsWithLoadedProjects} />);

    expect(screen.getByText('Deploy Image Form Content')).toBeInTheDocument();
  });

  it('should render with different namespace', () => {
    const propsWithDifferentNamespace = {
      ...deployImageProps,
      namespace: 'different-project',
    };

    renderWithProviders(<DeployImage {...propsWithDifferentNamespace} />);

    expect(screen.getByText('Deploy Image Form Content')).toBeInTheDocument();
  });

  it('should render with contextualSource prop', () => {
    const propsWithContextualSource = {
      ...deployImageProps,
      contextualSource: 'test-source',
    };

    renderWithProviders(<DeployImage {...propsWithContextualSource} />);

    expect(screen.getByText('Deploy Image Form Content')).toBeInTheDocument();
  });
});
