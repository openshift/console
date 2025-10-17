import { screen } from '@testing-library/react';
import { useFormikContext } from 'formik';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import DeploymentConfigSection from '../DeploymentConfigSection';

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
  EnvironmentField: (props) => `Environment Field - ${props.envs?.length || 0} envs`,
  CheckboxField: (props) => `CheckboxField ${props.name}`,
}));

jest.mock('formik', () => ({
  useFormikContext: jest.fn(),
}));

let deploymentConfigSectionProps: React.ComponentProps<typeof DeploymentConfigSection>;

describe('DeploymentConfigSection', () => {
  beforeEach(() => {
    deploymentConfigSectionProps = {
      namespace: 'my-app',
    };
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should render EnvironmentField and have values of Environment', () => {
    (useFormikContext as jest.Mock).mockReturnValue({
      values: {
        project: {
          name: 'my-app',
        },
        resources: 'kubernetes',
        deployment: {
          env: [
            {
              name: 'GREET',
              value: 'hi',
            },
          ],
        },
        import: {
          selectedStrategy: { type: 1 }, // dockerfile
          knativeFuncLoaded: true,
        },
      },
    });

    renderWithProviders(<DeploymentConfigSection {...deploymentConfigSectionProps} />);

    expect(screen.getByText(/Environment Field - 1 envs/)).toBeInTheDocument();
  });
});
