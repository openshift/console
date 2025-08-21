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
  Trans: (props) => props.children,
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

jest.mock('@console/internal/module/k8s', () => ({
  ...jest.requireActual('@console/internal/module/k8s'),
  referenceFor: () => 'apps~v1~Deployment',
  modelFor: () => ({ kind: 'Deployment', crd: false }),
}));

jest.mock('../RouteSection', () => ({
  __esModule: true,
  default: () => 'Route Section',
}));

jest.mock('../../../health-checks/HealthChecks', () => ({
  __esModule: true,
  default: () => 'Health Checks',
}));

jest.mock('../LabelSection', () => ({
  __esModule: true,
  default: () => 'Label Section',
}));

jest.mock('../ResourceLimitSection', () => ({
  __esModule: true,
  default: () => 'Resource Limit Section',
}));

jest.mock('../ScalingSection', () => ({
  __esModule: true,
  default: () => 'Scaling Section',
}));

jest.mock('../ServerlessScalingSection', () => ({
  __esModule: true,
  default: () => 'Serverless Scaling Section',
}));

jest.mock('../DeploymentConfigSection', () => ({
  __esModule: true,
  default: () => 'Deployment Config Section',
}));

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

    expect(screen.getByText(/Route Section/)).toBeInTheDocument();
    expect(screen.getByText(/Health Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Scaling Section/)).toBeInTheDocument();
    expect(screen.getByText(/Resource Limit Section/)).toBeInTheDocument();
    expect(screen.getByText(/Label Section/)).toBeInTheDocument();
    expect(screen.queryByText(/Serverless Scaling Section/)).not.toBeInTheDocument();
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

    expect(screen.getByText(/Route Section/)).toBeInTheDocument();
    expect(screen.getByText(/Health Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Scaling Section/)).toBeInTheDocument();
    expect(screen.getByText(/Resource Limit Section/)).toBeInTheDocument();
    expect(screen.getByText(/Label Section/)).toBeInTheDocument();
    expect(screen.queryByText(/Serverless Scaling Section/)).not.toBeInTheDocument();
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

    expect(screen.getByText(/Route Section/)).toBeInTheDocument();
    expect(screen.getByText(/Health Checks/)).toBeInTheDocument();
    expect(screen.getByText(/Serverless Scaling Section/)).toBeInTheDocument();
    expect(screen.getByText(/Resource Limit Section/)).toBeInTheDocument();
    expect(screen.getByText(/Label Section/)).toBeInTheDocument();
    expect(screen.queryByText(/^Scaling Section$/)).not.toBeInTheDocument();
  });
});
