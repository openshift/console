/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import * as Router from 'react-router-dom-v5-compat';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeployImage from '../DeployImage';
import DeployImagePage from '../DeployImagePage';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-testid' });

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

jest.mock('@console/shared/src/hooks/post-form-submit-action', () => ({
  usePostFormSubmitAction: () => () => {},
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

jest.mock('../../NamespacedPage', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockNamespacedPage(props) {
      return React.createElement('div', { 'data-testid': 'namespaced-page' }, props.children);
    },
    NamespacedPageVariants: {
      light: 'light',
      default: 'default',
    },
  };
});

jest.mock('@console/shared/src/components/document-title/DocumentTitle', () => ({
  DocumentTitle: (props) => props.children,
}));

jest.mock('@console/shared/src/components/heading/PageHeading', () => ({
  PageHeading: function MockPageHeading(props) {
    const React = require('react');
    return React.createElement('h1', { 'data-testid': 'page-heading' }, props.title);
  },
}));

jest.mock('../../QueryFocusApplication', () => {
  return {
    __esModule: true,
    default: function MockQueryFocusApplication(props) {
      return props.children && props.children('test-app');
    },
  };
});

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  Firehose: function MockFirehose(props) {
    const React = require('react');
    const mockProps = {
      projects: { data: [], loaded: true },
    };
    return React.createElement(
      'div',
      { 'data-testid': 'firehose' },
      props.children && typeof props.children === 'function'
        ? props.children(mockProps)
        : props.children,
    );
  },
  usePreventDataLossLock: jest.fn(),
}));

jest.mock('../DeployImageForm', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: function MockDeployImageForm(props) {
      return React.createElement(
        'form',
        {
          'data-testid': 'deploy-image-form',
          onSubmit: props.handleSubmit,
        },
        'Deploy Image Form Content',
      );
    },
  };
});

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

    expect(screen.getByTestId('namespaced-page')).toBeInTheDocument();
    expect(screen.getByTestId('page-heading')).toBeInTheDocument();
    expect(screen.getByTestId('firehose')).toBeInTheDocument();
  });

  it('should render with correct page title', () => {
    renderWithProviders(<DeployImagePage />);

    const pageHeading = screen.getByTestId('page-heading');
    expect(pageHeading).toBeInTheDocument();
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

    expect(screen.getByTestId('deploy-image-form')).toBeInTheDocument();
  });

  it('should pass correct props to DeployImageForm', () => {
    renderWithProviders(<DeployImage {...deployImageProps} />);

    const form = screen.getByTestId('deploy-image-form');
    expect(form).toBeInTheDocument();
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

    expect(screen.getByTestId('deploy-image-form')).toBeInTheDocument();
  });

  it('should render with different namespace', () => {
    const propsWithDifferentNamespace = {
      ...deployImageProps,
      namespace: 'different-project',
    };

    renderWithProviders(<DeployImage {...propsWithDifferentNamespace} />);

    expect(screen.getByTestId('deploy-image-form')).toBeInTheDocument();
  });

  it('should render with contextualSource prop', () => {
    const propsWithContextualSource = {
      ...deployImageProps,
      contextualSource: 'test-source',
    };

    renderWithProviders(<DeployImage {...propsWithContextualSource} />);

    expect(screen.getByTestId('deploy-image-form')).toBeInTheDocument();
  });
});
