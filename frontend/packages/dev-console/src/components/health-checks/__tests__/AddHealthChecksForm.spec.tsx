/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import AddHealthChecksForm from '../AddHealthChecksForm';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-testid' });

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  LoadingBox: function MockLoadingBox() {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'loading-box' }, 'Loading...');
  },
  StatusBox: function MockStatusBox({ loadError }) {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'status-box' }, `Error: ${loadError}`);
  },
  history: {
    goBack: jest.fn(),
    push: jest.fn(),
  },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  k8sUpdate: jest.fn(() => Promise.resolve()),
  modelFor: jest.fn(() => ({ kind: 'Deployment' })),
  referenceFor: jest.fn(() => 'apps~v1~Deployment'),
}));

jest.mock('../AddHealthChecks', () => {
  const React = require('react');
  const MockAddHealthChecks = React.forwardRef((props, ref) => {
    return React.createElement(
      'div',
      {
        'data-testid': 'add-health-checks',
        ref,
      },
      'Add Health Checks Form',
    );
  });
  MockAddHealthChecks.displayName = 'MockAddHealthChecks';
  return { __esModule: true, default: MockAddHealthChecks };
});

jest.mock('../create-health-checks-probe-utils', () => ({
  getHealthChecksData: jest.fn(() => ({})),
}));

jest.mock('../health-checks-utils', () => ({
  updateHealthChecksProbe: jest.fn(),
}));

jest.mock('../../edit-application/edit-application-utils', () => ({
  getResourcesType: jest.fn(() => ({})),
}));

let addHealthCheckWrapperProps: React.ComponentProps<typeof AddHealthChecksForm>;

describe('AddHealthChecksForm', () => {
  beforeEach(() => {
    addHealthCheckWrapperProps = {
      currentContainer: '',
      resource: {
        loaded: false,
        data: sampleDeployments.data[0],
        loadError: '',
      },
    };
  });

  describe('Loading States', () => {
    it('should show LoadingBox when data is not loaded', () => {
      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByTestId('loading-box')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should not show other components while loading', () => {
      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.queryByTestId('status-box')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-health-checks')).not.toBeInTheDocument();
    });
  });

  describe('Error States', () => {
    it('should show StatusBox on load error', () => {
      addHealthCheckWrapperProps.resource.loaded = true;
      addHealthCheckWrapperProps.resource.loadError = 'Not Found';

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByTestId('status-box')).toBeInTheDocument();
      expect(screen.getByText('Error: Not Found')).toBeInTheDocument();
    });

    it('should not show loading or form when there is an error', () => {
      addHealthCheckWrapperProps.resource.loaded = true;
      addHealthCheckWrapperProps.resource.loadError = 'Not Found';

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.queryByTestId('loading-box')).not.toBeInTheDocument();
      expect(screen.queryByTestId('add-health-checks')).not.toBeInTheDocument();
    });
  });

  describe('Container Validation', () => {
    it('should show container not found error when container is empty', () => {
      addHealthCheckWrapperProps.resource.loaded = true;
      addHealthCheckWrapperProps.currentContainer = '';

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByText('devconsole~Container not found')).toBeInTheDocument();
    });

    it('should show container not found error when container does not exist', () => {
      addHealthCheckWrapperProps.resource.loaded = true;
      addHealthCheckWrapperProps.currentContainer = 'non-existent-container';

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByText('devconsole~Container not found')).toBeInTheDocument();
    });
  });

  describe('Successful Form Rendering', () => {
    it('should load AddHealthChecks when container exists', () => {
      addHealthCheckWrapperProps = {
        currentContainer: 'wit-deployment',
        resource: {
          loaded: true,
          data: sampleDeployments.data[1],
          loadError: '',
        },
      };

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByTestId('add-health-checks')).toBeInTheDocument();
      expect(screen.getByText('Add Health Checks Form')).toBeInTheDocument();
    });

    it('should not show loading or error states when form renders successfully', () => {
      addHealthCheckWrapperProps = {
        currentContainer: 'wit-deployment',
        resource: {
          loaded: true,
          data: sampleDeployments.data[1],
          loadError: '',
        },
      };

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.queryByTestId('loading-box')).not.toBeInTheDocument();
      expect(screen.queryByTestId('status-box')).not.toBeInTheDocument();
      expect(screen.queryByText('devconsole~Container not found')).not.toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle resource with no containers', () => {
      const resourceWithoutContainers = {
        ...sampleDeployments.data[1],
        spec: {
          ...sampleDeployments.data[1].spec,
          template: {
            ...sampleDeployments.data[1].spec.template,
            spec: {
              ...sampleDeployments.data[1].spec.template.spec,
              containers: [],
            },
          },
        },
      };

      addHealthCheckWrapperProps = {
        currentContainer: 'any-container',
        resource: {
          loaded: true,
          data: resourceWithoutContainers,
          loadError: '',
        },
      };

      renderWithProviders(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);

      expect(screen.getByText('devconsole~Container not found')).toBeInTheDocument();
    });
  });
});
