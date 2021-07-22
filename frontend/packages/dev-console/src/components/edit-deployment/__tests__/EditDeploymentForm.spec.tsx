import * as React from 'react';
import { render, fireEvent, screen, cleanup, waitFor, configure } from '@testing-library/react';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { mockDeploymentConfig, mockEditDeploymentData } from '../__mocks__/edit-deployment-data';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import EditDeploymentForm from '../EditDeploymentForm';

configure({ testIdAttribute: 'data-test' });

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

const mockContainerField: React.FC = () => {
  return <div>Container: xyz</div>;
};

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

const mockedContainerField = ContainerField as jest.Mock<React.FC>;

const handleSubmit = jest.fn();
const handleCancel = jest.fn();

beforeAll(() => {
  mockedContainerField.mockImplementation(mockContainerField);
});

beforeEach(() =>
  render(
    <MockForm handleSubmit={handleSubmit}>
      {(props) => (
        <Provider store={store}>
          <EditDeploymentForm
            {...props}
            heading="Edit DeploymentConfig"
            resource={mockDeploymentConfig}
            handleCancel={handleCancel}
          />
        </Provider>
      )}
    </MockForm>,
  ),
);

afterEach(() => cleanup());

describe('EditDeploymentForm', () => {
  it('should show Form/YAML swicther with both options and Form view selected by default', async () => {
    await waitFor(() => {
      expect(screen.queryByTestId('synced-editor-field')).not.toBeNull();
      expect(screen.queryByRole('radio', { name: /form view/i })).not.toBeNull();
      expect(
        screen.queryByRole('radio', {
          name: /yaml view/i,
        }),
      ).not.toBeNull();
      expect(
        screen.queryByRole('radio', { name: /form view/i }).hasAttribute('checked'),
      ).toBeTruthy();
    });
  });

  it('should show all the form sections wrt form/YAML view', async () => {
    const formButton = screen.getByRole('radio', { name: /form view/i });
    const yamlButton = screen.getByRole('radio', {
      name: /yaml view/i,
    });

    fireEvent.click(yamlButton);

    await waitFor(() => {
      expect(screen.queryByTestId('yaml-editor')).not.toBeNull();
      expect(screen.queryByTestId('form-footer')).not.toBeNull();
    });

    fireEvent.click(formButton);

    await waitFor(() => {
      expect(screen.queryByTestId('info-alert')).not.toBeNull();
      expect(screen.queryByTestId('deployment-strategy-section')).not.toBeNull();
      expect(screen.queryByTestId('images-section')).not.toBeNull();
      expect(screen.queryByTestId('environment-variables-section')).not.toBeNull();
      expect(screen.queryByTestId('advanced-options-section')).not.toBeNull();
      expect(screen.queryByTestId('form-footer')).not.toBeNull();
    });
  });

  it('should disable save button and show loader on save button click', async () => {
    const saveButton = screen.getByRole('button', {
      name: /save/i,
    });
    const timeoutField = screen.getByRole('spinbutton', {
      name: /timeout/i,
    }) as HTMLInputElement;

    const mockValues = _.cloneDeep(mockEditDeploymentData);
    mockValues.formData.isSearchingForImage = true;
    mockValues.formData.deploymentStrategy.rollingParams.timeoutSeconds = 500;

    fireEvent.change(timeoutField, { target: { value: 500 } });

    expect(saveButton.hasAttribute('disabled')).toBeFalsy();
    await waitFor(() => {
      expect(timeoutField.value).toEqual('500');
    });

    fireEvent.click(saveButton);

    expect(saveButton.hasAttribute('disabled')).toBeTruthy();
    expect(screen.queryByTestId('loading-indicator')).not.toBeNull();
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledTimes(1);
      expect(handleSubmit).toHaveBeenCalledWith(mockValues);
    });
  });

  it('should load the form with current resource values on reload button click', async () => {
    const reloadButton = screen.getByRole('button', {
      name: /reload/i,
    });
    const timeoutField = screen.getByRole('spinbutton', {
      name: /timeout/i,
    }) as HTMLInputElement;

    fireEvent.change(timeoutField, { target: { value: 500 } });

    await waitFor(() => {
      expect(timeoutField.value).toEqual('500');
    });

    fireEvent.click(reloadButton);

    await waitFor(() => {
      expect(timeoutField.value).toEqual('600');
    });
  });

  it('should call handleCancel on Cancel button click ', async () => {
    const cancelButton = screen.getByRole('button', {
      name: /cancel/i,
    });

    fireEvent.click(cancelButton);

    await waitFor(() => expect(handleCancel).toHaveBeenCalledTimes(1));
  });
});
