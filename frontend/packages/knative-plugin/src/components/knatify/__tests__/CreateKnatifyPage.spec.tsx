import * as Router from 'react-router-dom-v5-compat';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { useRelatedHPA } from '@console/shared/src/hooks/hpa-hooks';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { deploymentData } from '../../../utils/__tests__/knative-serving-data';
import CreateKnatifyPage from '../CreateKnatifyPage';

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/hpa-hooks', () => ({
  useRelatedHPA: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: jest.fn(() => null),
  Kebab: {
    factory: {
      ModifyLabels: jest.fn(),
      ModifyAnnotations: jest.fn(),
      common: [],
    },
  },
  withHandlePromise: (Component: any) => Component,
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: jest.fn(() => null),
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: jest.fn(() => null),
}));

jest.mock('@console/dev-console/src/components/NamespacedPage', () => ({
  __esModule: true,
  default: jest.fn(() => null),
  NamespacedPageVariants: {
    light: 'light',
    default: 'default',
  },
}));

jest.mock('formik', () => ({
  Formik: jest.fn(() => null),
}));

jest.mock('@console/internal/module/k8s', () => ({
  referenceFor: jest.fn(() => 'apps~v1~Deployment'),
  referenceForModel: jest.fn(() => 'apps~v1~Deployment'),
  ImagePullPolicy: {
    Always: 'Always',
    IfNotPresent: 'IfNotPresent',
    Never: 'Never',
  },
  K8sResourceConditionStatus: {
    True: 'True',
    False: 'False',
    Unknown: 'Unknown',
  },
}));

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: jest.fn(),
  useLocation: jest.fn(),
  useNavigate: jest.fn(() => jest.fn()),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: any) => Component,
}));

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;
const useRelatedHPAMock = useRelatedHPA as jest.Mock;

describe('CreateKnatifyPage', () => {
  beforeEach(() => {
    useK8sWatchResourcesMock.mockClear();
    jest.spyOn(Router, 'useParams').mockReturnValue({
      pathname: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
      search: 'knatify/ns/jai-test-1?name=ruby-ex-git-dc&kind=Deployment',
      state: null,
      hash: null,
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: '',
      search: '',
      state: null,
      hash: '',
      key: 'default',
    });
  });

  it('should render without errors when resources are not loaded yet', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([{}, true, null]);
    expect(() => renderWithProviders(<CreateKnatifyPage />)).not.toThrow();
  });

  it('should render without errors when HPA is not loaded', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([null, false, null]);
    expect(() => renderWithProviders(<CreateKnatifyPage />)).not.toThrow();
  });

  it('should render with complete data without errors', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imageStream: { data: [], loaded: false },
      projects: { data: [], loaded: true },
      workloadResource: { data: deploymentData, loaded: true },
    });
    useRelatedHPAMock.mockReturnValue([{}, true, null]);
    expect(() => renderWithProviders(<CreateKnatifyPage />)).not.toThrow();
  });
});
