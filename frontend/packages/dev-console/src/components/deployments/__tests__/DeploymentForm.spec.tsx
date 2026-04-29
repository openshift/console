import type { FC } from 'react';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18n from 'i18next';
import * as _ from 'lodash';
import { setI18n } from 'react-i18next';
import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import { mockDeploymentConfig, mockEditDeploymentData } from '../__mocks__/deployment-data';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import DeploymentForm from '../DeploymentForm';

class ResizeObserver {
  observe() {
    // do nothing
  }

  unobserve() {
    // do nothing
  }

  disconnect() {
    // do nothing
  }
}

window.ResizeObserver = ResizeObserver;

const mockContainerField: FC = () => {
  return <div>Container: xyz</div>;
};

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

jest.mock('@console/shared/src/hooks/useUserPreference', () => ({
  useUserPreference: jest.fn(() => [undefined, jest.fn(), true]),
}));

jest.mock(
  '@console/app/src/components/user-preferences/synced-editor/usePreferredCreateEditMethod',
  () => ({
    usePreferredCreateEditMethod: jest.fn(() => [undefined, true]),
  }),
);

const mockedContainerField = jest.mocked(ContainerField);

const handleSubmit = jest.fn();
const handleCancel = jest.fn();

function setupI18n() {
  if (!i18n.services) {
    (i18n as any).services = {};
  }
  i18n.services.interpolator = {
    init: () => undefined,
    reset: () => undefined,
    resetRegExp: () => undefined,
    interpolate: (str: string) => str,
    nest: (str: string) => str,
  };
  setI18n(i18n);
}

function renderDeploymentForm() {
  renderWithProviders(
    <MockForm handleSubmit={handleSubmit}>
      {(props) => (
        <DeploymentForm
          {...props}
          heading="Edit DeploymentConfig"
          resource={mockDeploymentConfig}
          handleCancel={handleCancel}
        />
      )}
    </MockForm>,
  );
}

beforeAll(() => {
  mockedContainerField.mockImplementation(mockContainerField);
});

beforeEach(() => {
  setupI18n();
});

describe('EditDeploymentForm', () => {
  it('should show Form/YAML swicther with both options and Form view selected by default', async () => {
    renderDeploymentForm();
    expect(await screen.findByTestId('synced-editor-field')).toBeVisible();
    expect(await screen.findByRole('radio', { name: /form view/i })).toBeVisible();
    expect(await screen.findByRole('radio', { name: /yaml view/i })).toBeVisible();
    expect(screen.getByRole('radio', { name: /form view/i })).toBeChecked();
  });

  it('should show all the form sections wrt form/YAML view', async () => {
    renderDeploymentForm();
    const user = userEvent.setup();
    const formButton = screen.getByRole('radio', { name: /form view/i });
    const yamlButton = screen.getByRole('radio', {
      name: /yaml view/i,
    });

    await user.click(yamlButton);

    expect(await screen.findByTestId('yaml-editor')).toBeVisible();
    expect(await screen.findByTestId('form-footer')).toBeVisible();

    await user.click(formButton);

    expect(await screen.findByTestId('info-alert')).toBeVisible();
    expect(await screen.findByTestId('deployment-strategy-section')).toBeVisible();
    expect(await screen.findByTestId('images-section')).toBeVisible();
    expect(await screen.findByTestId('environment-variables-section')).toBeVisible();
    expect(await screen.findByTestId('advanced-options-section')).toBeVisible();
    expect(await screen.findByTestId('form-footer')).toBeVisible();
  });

  it('should disable save button and show loader on save button click', async () => {
    renderDeploymentForm();
    const user = userEvent.setup();
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    const timeoutField = screen.getByRole('spinbutton', {
      name: /timeout/i,
    }) as HTMLInputElement;

    const mockValues = _.cloneDeep(mockEditDeploymentData);
    mockValues.formData.isSearchingForImage = true;
    mockValues.formData.deploymentStrategy.rollingParams.timeoutSeconds = 500;

    await user.clear(timeoutField);
    await user.type(timeoutField, '500');

    expect(saveButton.hasAttribute('disabled')).toBeFalsy();
    await waitFor(() => {
      expect(timeoutField.value).toEqual('500');
    });

    await user.click(saveButton);

    await waitFor(() => {
      expect(saveButton).toBeDisabled();
      expect(within(saveButton).getByRole('progressbar')).toBeInTheDocument();
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });
  });

  it('should load the form with current resource values on reload button click', async () => {
    renderDeploymentForm();
    const user = userEvent.setup();
    const reloadButton = screen.getByRole('button', {
      name: /reload/i,
    });
    const timeoutField = screen.getByRole('spinbutton', {
      name: /timeout/i,
    }) as HTMLInputElement;

    await user.clear(timeoutField);
    await user.type(timeoutField, '500');

    await waitFor(() => {
      expect(timeoutField.value).toEqual('500');
    });

    await user.click(reloadButton);

    await waitFor(() => {
      expect(timeoutField.value).toEqual('600');
    });
  });

  it('should call handleCancel on Cancel button click ', async () => {
    renderDeploymentForm();
    const user = userEvent.setup();
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });

    await user.click(cancelButton);

    await waitFor(() => expect(handleCancel).toHaveBeenCalledTimes(1));
  });
});
