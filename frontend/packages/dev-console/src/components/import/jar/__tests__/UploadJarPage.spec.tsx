/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, render, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import UploadJarPage from '../UploadJarPage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

const useK8sWatchResourcesMock = useK8sWatchResources as jest.Mock;

jest.mock('@console/internal/components/utils', () => ({
  LoadingBox: function MockLoadingBox() {
    const React = require('react');
    return React.createElement('div', { 'data-test': 'loading-box' }, 'Loading...');
  },
}));

jest.mock('@console/internal/components/utils/k8s-watch-hook', () => ({
  useK8sWatchResources: jest.fn(),
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: function MockPageHeading(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'page-heading',
        'data-title': props.title,
        'data-help-text': props.helpText,
      },
      props.title,
    );
  },
}));

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: function MockDocumentTitle(props) {
    const React = require('react');
    return React.createElement(
      'div',
      {
        'data-test': 'document-title',
      },
      props.children,
    );
  },
}));

jest.mock('../../../NamespacedPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespacedPage(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'namespaced-page',
          'data-disabled': props.disabled,
          'data-variant': props.variant,
        },
        props.children,
      );
    },
    NamespacedPageVariants: {
      light: 'light',
    },
  };
});

jest.mock('../../../QueryFocusApplication', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockQueryFocusApplication(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'query-focus-application',
        },
        props.children && props.children('test-app'),
      );
    },
  };
});

jest.mock('../UploadJar', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockUploadJar(props) {
      return React.createElement(
        'div',
        {
          'data-test': 'upload-jar',
          'data-for-application': props.forApplication,
          'data-namespace': props.namespace,
          'data-contextual-source': props.contextualSource,
        },
        'Upload Jar',
      );
    },
  };
});

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
    useK8sWatchResourcesMock.mockClear();
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
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: true },
      projects: { data: [], loaded: true },
    });

    render(<UploadJarPage />);

    expect(screen.getByTestId('page-heading')).toBeInTheDocument();
    expect(screen.queryByTestId('loading-box')).not.toBeInTheDocument();
    expect(screen.getByTestId('namespaced-page')).toBeInTheDocument();
    expect(screen.getByTestId('document-title')).toBeInTheDocument();
    expect(screen.getByTestId('query-focus-application')).toBeInTheDocument();
    expect(screen.getByTestId('upload-jar')).toBeInTheDocument();
    const pageHeading = screen.getByTestId('page-heading');
    expect(pageHeading.getAttribute('data-title')).toBe('devconsole~Upload JAR file');
    expect(pageHeading.getAttribute('data-help-text')).toBe(
      'devconsole~Upload a JAR file from your local desktop to OpenShift',
    );
  });

  it('should render LoadingBox not page', () => {
    useK8sWatchResourcesMock.mockReturnValue({
      imagestream: { data: [], loaded: false },
      projects: { data: [], loaded: false },
    });

    render(<UploadJarPage />);
    expect(screen.queryByTestId('page-heading')).not.toBeInTheDocument();
    expect(screen.getByTestId('loading-box')).toBeInTheDocument();
    expect(screen.queryByTestId('namespaced-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('upload-jar')).not.toBeInTheDocument();
  });
});
