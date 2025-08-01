/* eslint-disable global-require, @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports */
import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { BuildOptions, Resources } from '../../import-types';
import AdvancedSection from '../AdvancedSection';
import '@testing-library/jest-dom';

configure({ testIdAttribute: 'data-test' });

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: function MockTrans(props) {
    const React = require('react');
    return React.createElement('span', { 'data-testid': 'trans' }, props.children);
  },
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../RouteSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-test': 'route-section' }, 'Route Section'),
  };
});

jest.mock('../../../health-checks/HealthChecks', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-test': 'health-checks' }, 'Health Checks'),
  };
});

jest.mock('../LabelSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () => React.createElement('div', { 'data-test': 'label-section' }, 'Label Section'),
  };
});

jest.mock('../ResourceLimitSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        'div',
        { 'data-test': 'resource-limit-section' },
        'Resource Limit Section',
      ),
  };
});

jest.mock('../ScalingSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement('div', { 'data-test': 'scaling-section' }, 'Scaling Section'),
  };
});

jest.mock('../ServerlessScalingSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        'div',
        { 'data-test': 'serverless-scaling-section' },
        'Serverless Scaling Section',
      ),
  };
});

jest.mock('../DeploymentConfigSection', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: () =>
      React.createElement(
        'div',
        { 'data-test': 'deployment-config-section' },
        'Deployment Config Section',
      ),
  };
});

jest.mock('@console/shared/src', () => ({
  ...jest.requireActual('@console/shared/src'),
  ProgressiveList: ({ children }) => children,
  ProgressiveListItem: ({ children }) => children,
}));

let advanceSectionProps: React.ComponentProps<typeof AdvancedSection>;

describe('AdvancedSection', () => {
  beforeEach(() => {
    advanceSectionProps = {
      ...formikFormProps,
      values: {
        route: {
          disable: true,
        },
        project: {
          name: 'my-app',
        },
        resources: Resources.Kubernetes,
        build: {
          option: BuildOptions.BUILDS,
        },
        deployment: {
          env: [],
        },
        pipeline: {
          enabled: false,
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Should render advance section for Kubernetes(D) resource and not serverless sections', () => {
    renderWithProviders(<AdvancedSection {...advanceSectionProps} />);

    expect(screen.getByTestId('route-section')).toBeInTheDocument();
    expect(screen.getByTestId('health-checks')).toBeInTheDocument();
    expect(screen.getByTestId('scaling-section')).toBeInTheDocument();
    expect(screen.getByTestId('resource-limit-section')).toBeInTheDocument();
    expect(screen.getByTestId('label-section')).toBeInTheDocument();
    expect(screen.queryByTestId('serverless-scaling-section')).not.toBeInTheDocument();
  });

  it('Should render advance section for openshift(DC) resource and not show BuildConfigSection if pipelines enabled', () => {
    const newAdvanceSectionProps = {
      ...advanceSectionProps,
      values: {
        ...advanceSectionProps.values,
        resources: Resources.OpenShift,
        pipeline: {
          enabled: true,
        },
      },
    };

    renderWithProviders(<AdvancedSection {...newAdvanceSectionProps} />);

    expect(screen.getByTestId('route-section')).toBeInTheDocument();
    expect(screen.getByTestId('health-checks')).toBeInTheDocument();
    expect(screen.getByTestId('scaling-section')).toBeInTheDocument();
    expect(screen.getByTestId('resource-limit-section')).toBeInTheDocument();
    expect(screen.getByTestId('label-section')).toBeInTheDocument();
    expect(screen.queryByTestId('serverless-scaling-section')).not.toBeInTheDocument();
  });

  it('Should render advance section specific for knative(KSVC) resource', () => {
    const newAdvanceSectionProps = {
      ...advanceSectionProps,
      values: {
        ...advanceSectionProps.values,
        resources: Resources.KnativeService,
      },
    };

    renderWithProviders(<AdvancedSection {...newAdvanceSectionProps} />);

    expect(screen.getByTestId('route-section')).toBeInTheDocument();
    expect(screen.getByTestId('health-checks')).toBeInTheDocument();
    expect(screen.getByTestId('serverless-scaling-section')).toBeInTheDocument();
    expect(screen.getByTestId('resource-limit-section')).toBeInTheDocument();
    expect(screen.getByTestId('label-section')).toBeInTheDocument();
    expect(screen.queryByTestId('scaling-section')).not.toBeInTheDocument();
  });
});
