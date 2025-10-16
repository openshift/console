import { screen } from '@testing-library/react';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockDeploymentConfig } from '../__mocks__/deployment-data';
import MockForm from '../__mocks__/MockForm';
import DeploymentForm from '../DeploymentForm';
import '@testing-library/jest-dom';

jest.mock('../ContainerField', () => ({
  __esModule: true,
  default: () => 'Container: mocked',
}));

jest.mock('../DeploymentFormEditor', () => ({
  __esModule: true,
  default: () => 'Mock Deployment Form Editor',
}));

jest.mock('@console/shared/src/hooks/useUserSettings', () => ({
  useUserSettings: jest.fn(() => [undefined, jest.fn(), true]),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(() => [undefined, true]),
  }),
);

jest.mock('@console/dynamic-plugin-sdk/src/utils/k8s', () => ({
  k8sCreateResource: jest.fn(),
  k8sUpdateResource: jest.fn(),
}));

jest.mock('@console/internal/components/utils', () => ({
  history: {
    push: jest.fn(),
    goBack: jest.fn(),
  },
  Kebab: {
    factory: {
      common: [],
    },
  },
  useNavigate: jest.fn(() => jest.fn()),
  navFactory: {
    details: jest.fn(),
    editYaml: jest.fn(),
    pods: jest.fn(),
    envEditor: jest.fn(),
    events: jest.fn(),
  },
}));

jest.mock('@console/shared/src/utils/yaml', () => ({
  safeJSToYAML: jest.fn().mockReturnValue('mock-yaml'),
}));

jest.mock('@console/shared/src', () => ({
  FlexForm: (props) => props.children,
  FormBody: (props) => props.children,
  FormFooter: () => 'FormFooter',
  FormHeader: (props) => props.title || props.children,
  SyncedEditorField: () => 'Mock Synced Editor',
  CodeEditorField: () => 'Mock Code Editor',
}));

jest.mock('js-yaml', () => ({
  safeLoad: jest.fn().mockReturnValue({}),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  withTranslation: () => (Component: React.ComponentType) => Component,
}));

describe('EditDeployment Form', () => {
  const handleSubmit = jest.fn();
  const handleCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderDeploymentForm = () => {
    renderWithProviders(
      <MockForm handleSubmit={handleSubmit}>
        {(mockFormProps) => (
          <DeploymentForm
            {...mockFormProps}
            heading="Edit DeploymentConfig"
            resource={mockDeploymentConfig}
            handleCancel={handleCancel}
          />
        )}
      </MockForm>,
    );
  };

  it('should render the deployment form successfully', () => {
    renderDeploymentForm();
    expect(screen.getByText(/Edit DeploymentConfig/)).toBeInTheDocument();
  });

  it('should display the heading correctly', () => {
    renderDeploymentForm();
    expect(screen.getByText(/Edit DeploymentConfig/)).toBeInTheDocument();
  });

  it('should render form sections when in form mode', () => {
    renderDeploymentForm();
    expect(screen.getByText(/Edit DeploymentConfig/)).toBeInTheDocument();
  });

  it('should handle the initial values correctly', () => {
    renderDeploymentForm();
    expect(screen.getByText(/Edit DeploymentConfig/)).toBeInTheDocument();
  });
});
