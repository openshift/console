import { configure, screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { InsecureTrafficType, Resources, TerminationType } from '../../import-types';
import RouteSection from '../RouteSection';
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

jest.mock('../../route/PortInputField', () => ({
  __esModule: true,
  default: (props) => `Port Input Field defaultPort=${props.defaultPort}`,
}));

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  CheckboxField: (props) => `CheckboxField ${props.name}`,
}));

jest.mock('../../route/AdvancedRouteOptions', () => ({
  __esModule: true,
  default: () => 'Advanced Route Options',
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(() => ({
    values: {
      image: { ports: [] },
    },
    setFieldValue: jest.fn(),
    setFieldTouched: jest.fn(),
  })),
}));

describe('RouteSection', () => {
  let props: React.ComponentProps<typeof RouteSection>;

  beforeEach(() => {
    props = {
      route: {
        create: true,
        defaultUnknownPort: 8080,
        disable: false,
        hostname: '',
        path: '',
        secure: false,
        targetPort: '',
        tls: {
          caCertificate: '',
          certificate: '',
          destinationCACertificate: '',
          insecureEdgeTerminationPolicy: 'None' as InsecureTrafficType,
          key: '',
          termination: 'None' as TerminationType,
        },
        unknownTargetPort: '',
        labels: {},
      },
      resources: Resources.OpenShift,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Render RouteCheckbox', () => {
    renderWithProviders(<RouteSection {...props} />);

    expect(screen.getByText(/Port Input Field/)).toBeInTheDocument();
    expect(screen.getByText(/CheckboxField route\.create/)).toBeInTheDocument();
    expect(screen.getByText(/Advanced Route Options/)).toBeInTheDocument();
  });

  it('should show the Target port field if the create route checkbox is checked', () => {
    renderWithProviders(<RouteSection {...props} />);

    expect(screen.getByText(/Port Input Field defaultPort=8080/)).toBeInTheDocument();
  });

  it('should also show the Target port field if the create route checkbox is not checked', () => {
    props.route.create = false;
    renderWithProviders(<RouteSection {...props} />);

    expect(screen.getByText(/Port Input Field defaultPort=8080/)).toBeInTheDocument();
  });
});
