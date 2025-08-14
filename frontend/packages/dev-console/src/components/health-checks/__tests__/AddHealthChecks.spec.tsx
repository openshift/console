import { configure, screen } from '@testing-library/react';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { sampleDeployments } from '@console/shared/src/utils/__tests__/test-resource-data';
import { getResourcesType } from '../../edit-application/edit-application-utils';
import AddHealthChecks from '../AddHealthChecks';
import '@testing-library/jest-dom';
import { getHealthChecksData } from '../create-health-checks-probe-utils';

configure({ testIdAttribute: 'data-test' });

global.ResizeObserver = class ResizeObserver {
  observe = () => {};

  unobserve = () => {};

  disconnect = () => {};
};

jest.mock('react-i18next', () => ({
  __esModule: true,
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  Trans: ({ children }) => children,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../health-checks-utils', () => ({
  ...jest.requireActual('../health-checks-utils'),
  useViewOnlyAccess: () => false,
  HealthCheckContext: { Provider: ({ children }) => children },
}));

jest.mock('../../edit-application/edit-application-utils', () => ({
  ...jest.requireActual('../../edit-application/edit-application-utils'),
  getResourcesType: () => 'Deployment',
}));

jest.mock('../create-health-checks-probe-utils', () => ({
  ...jest.requireActual('../create-health-checks-probe-utils'),
  getHealthChecksData: () => ({
    readinessProbe: {},
    livenessProbe: {},
    startupProbe: {},
  }),
}));

jest.mock('../HealthChecks', () => ({
  __esModule: true,
  default: () => 'Health Checks Component',
}));

let addHealthCheckProbs: React.ComponentProps<typeof AddHealthChecks>;

describe('AddHealthChecks', () => {
  beforeEach(() => {
    addHealthCheckProbs = {
      ...formikFormProps,
      currentContainer: 'wit-deployment',
      resource: sampleDeployments.data[2],
      values: {
        containerName: 'wit-deployment',
      },
      initialValues: {
        healthChecks: getHealthChecksData(sampleDeployments.data[1]),
        containerName: 'wit-deployment',
        resources: getResourcesType(sampleDeployments.data[1]),
        image: {
          ports: sampleDeployments.data[1].spec.template.spec.containers[0].ports,
        },
      },
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should load AddHealthChecks', () => {
    renderWithProviders(<AddHealthChecks {...addHealthCheckProbs} />);
    expect(screen.getByTestId('page-heading')).toBeInTheDocument();
    expect(screen.getByTestId('health-checks-heading')).toBeInTheDocument();
    expect(screen.getAllByTestId('jaeger-all-in-one-inmemory')).toHaveLength(2);
    expect(screen.getByTestId('form-footer')).toBeInTheDocument();
  });
});
