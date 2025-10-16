import { screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import BuildConfigSection from '../BuildConfigSection';
import '@testing-library/jest-dom';

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

jest.mock('@console/shared', () => ({
  ...jest.requireActual('@console/shared'),
  CheckboxField: (props) => `CheckboxField ${props.name}`,
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

let BuildConfigSectionProps: React.ComponentProps<typeof BuildConfigSection>;

describe('BuildConfigSection', () => {
  beforeEach(() => {
    BuildConfigSectionProps = {};
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render CheckboxField if triggers are there', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        project: {
          name: 'my-app',
        },
        resources: 'kubernetes',
        build: {
          env: [],
          triggers: {
            webhook: true,
            config: true,
            image: true,
          },
          strategy: 'Source',
        },
        image: { selected: 'nodejs-ex', tag: 'latest' },
        import: {
          selectedStrategy: '',
        },
      },
    });

    renderWithProviders(<BuildConfigSection {...BuildConfigSectionProps} />);

    expect(screen.getByText(/CheckboxField build\.triggers\.webhook/)).toBeInTheDocument();
    expect(screen.getByText(/CheckboxField build\.triggers\.image/)).toBeInTheDocument();
    expect(screen.getByText(/CheckboxField build\.triggers\.config/)).toBeInTheDocument();
  });

  it('should not render CheckboxField if triggers not there', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        build: {
          env: [],
          triggers: {},
          strategy: 'Source',
        },
        image: { selected: 'nodejs-ex', tag: 'latest' },
        import: {
          selectedStrategy: '',
        },
      },
    });

    renderWithProviders(<BuildConfigSection {...BuildConfigSectionProps} />);

    expect(screen.queryByText(/CheckboxField build\.triggers\.webhook/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CheckboxField build\.triggers\.image/)).not.toBeInTheDocument();
    expect(screen.queryByText(/CheckboxField build\.triggers\.config/)).not.toBeInTheDocument();
  });
});
