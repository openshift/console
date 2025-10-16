import { render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJarPage from '../UploadJarPage';
import '@testing-library/jest-dom';

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: () => 'Loading...',
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: (props) => `PageHeading title="${props.title}" helpText="${props.helpText}"`,
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('../../../NamespacedPage', () => ({
  __esModule: true,
  default: (props) => props.children,
  NamespacedPageVariants: {
    light: 'light',
  },
}));

jest.mock('../../../QueryFocusApplication', () => ({
  __esModule: true,
  default: (props) => props.children && props.children('test-app'),
}));

jest.mock('../UploadJar', () => ({
  __esModule: true,
  default: () => 'UploadJar',
}));

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
}));

jest.mock('@console/internal/models', () => ({
  ImageStreamModel: { kind: 'ImageStream' },
  ProjectModel: { kind: 'Project' },
}));

jest.mock('../../../../const', () => ({
  IMAGESTREAM_NAMESPACE: 'openshift',
  JAVA_IMAGESTREAM_NAME: 'java',
  QUERY_PROPERTIES: {
    CONTEXT_SOURCE: 'contextSource',
  },
}));

jest.mock('../../../../utils/imagestream-utils', () => ({
  normalizeBuilderImages: jest.fn(() => ({
    java: {
      name: 'java',
      title: 'Java',
    },
  })),
}));

describe('UploadJarPage', () => {
  beforeEach(() => {
    (useK8sWatchResources as jest.Mock).mockClear();
    jest.spyOn(Router, 'useParams').mockReturnValue({
      ns: 'openshift',
    });
    jest.spyOn(Router, 'useLocation').mockReturnValue({
      pathname: 'upload-jar/ns/jai-test-1',
      search: 'upload-jar/ns/jai-test-1',
      state: null,
      hash: null,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render page not LoadingBox', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      imagestream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
    });

    render(<UploadJarPage />);

    expect(
      screen.getByText(
        /PageHeading title=".*Upload JAR file.*" helpText=".*Upload a JAR file from your local desktop to OpenShift.*"/,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Loading\.\.\./)).not.toBeInTheDocument();
    expect(screen.getByText(/UploadJar/)).toBeInTheDocument();
  });

  it('should render LoadingBox not page', () => {
    (useK8sWatchResources as jest.Mock).mockReturnValue({
      imagestream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
    });

    render(<UploadJarPage />);

    expect(screen.queryByText(/PageHeading/)).not.toBeInTheDocument();
    expect(screen.getByText(/Loading\.\.\./)).toBeInTheDocument();
    expect(screen.queryByText(/UploadJar/)).not.toBeInTheDocument();
  });
});
