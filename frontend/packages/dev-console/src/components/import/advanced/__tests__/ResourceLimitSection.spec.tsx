import { screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { formikFormProps } from '@console/shared/src/test-utils/formik-props-utils';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import ResourceLimitSection from '../ResourceLimitSection';

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

jest.mock('../../section/FormSection', () => ({
  __esModule: true,
  default: (props) => `${props.title || ''} ${props.subTitle || ''} ${props.children}`,
}));

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  ResourceLimitField: (props) => `ResourceLimitField: ${props.label}`,
}));

jest.mock('@console/shared/src/components/heading/TertiaryHeading', () => ({
  __esModule: true,
  default: (props) => props.children,
}));

jest.mock('@console/internal/components/utils', () => ({
  ...jest.requireActual('@console/internal/components/utils'),
  ResourceIcon: (props) => `Icon:${props.kind}`,
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

let resourceLimitSectionProps: React.ComponentProps<typeof ResourceLimitSection>;

describe('ResourceLimitSection', () => {
  beforeEach(() => {
    resourceLimitSectionProps = {
      ...formikFormProps,
      hideTitle: true,
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render helptext for resource limit section', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(
      screen.getByText(
        /Resource limits control how much CPU and memory a container will consume on a node/,
      ),
    ).toBeInTheDocument();
  });

  it('should not render Title for resource limit section', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(screen.queryByText(/Resource Limits/)).not.toBeInTheDocument();
  });

  it('should render resource limit section with container', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: 'nodejs-container',
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(
      screen.getByText(
        /Resource limits control how much CPU and memory a container will consume on a node/,
      ),
    ).toBeInTheDocument();
  });

  it('should not render container for resource limit section', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        limits: {
          cpu: {
            request: '',
            requestUnit: '',
            defaultRequestUnit: '',
            limit: '',
            limitUnit: '',
            defaultLimitUnit: '',
          },
          memory: {
            request: '',
            requestUnit: 'Mi',
            defaultRequestUnit: 'Mi',
            limit: '',
            limitUnit: 'Mi',
            defaultLimitUnit: 'Mi',
          },
        },
        container: undefined,
      },
    });

    renderWithProviders(<ResourceLimitSection {...resourceLimitSectionProps} />);

    expect(screen.queryByText(/nodejs-container/)).not.toBeInTheDocument();
  });
});
