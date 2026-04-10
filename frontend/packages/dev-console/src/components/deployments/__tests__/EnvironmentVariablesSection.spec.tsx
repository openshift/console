import type { FC } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { mockEditDeploymentData, mockDeploymentConfig } from '../__mocks__/deployment-data';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import EnvironmentVariablesSection from '../EnvironmentVariablesSection';

const MockContainerField: FC = () => <div>Container: foo</div>;

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

const mockedContainerField = jest.mocked(ContainerField);
const handleSubmit = jest.fn();
const mockInitialValues = _.cloneDeep(mockEditDeploymentData);
mockInitialValues.formData.envs = [
  { name: 'xyz', value: 'abc' },
  { name: 'xyz2', value: 'abc2' },
];

beforeAll(() => {
  mockedContainerField.mockImplementation(MockContainerField);
});

const renderEnvironmentVariablesSection = () =>
  render(
    <MockForm initialValues={mockInitialValues} handleSubmit={handleSubmit}>
      {() => (
        <Provider store={store}>
          <EnvironmentVariablesSection resourceObj={mockDeploymentConfig} />
        </Provider>
      )}
    </MockForm>,
  );

describe('EnvironmentVariablesSection', () => {
  it('should show initial name value pairs', async () => {
    renderEnvironmentVariablesSection();
    const names = screen.getAllByPlaceholderText(/name/i).map((ele: HTMLInputElement) => ele.value);
    const values = screen
      .getAllByPlaceholderText(/value/i)
      .map((ele: HTMLInputElement) => ele.value);
    expect(names).toEqual(['xyz', 'xyz2']);
    expect(values).toEqual(['abc', 'abc2']);
  });

  it('should add a new row when (+) Add button is clicked', async () => {
    renderEnvironmentVariablesSection();
    const user = userEvent.setup();
    const addButton = screen.getByRole('button', { name: /add value/i });

    await user.click(addButton);

    const names = screen.getAllByPlaceholderText(/name/i).map((ele: HTMLInputElement) => ele.value);
    const values = screen
      .getAllByPlaceholderText(/value/i)
      .map((ele: HTMLInputElement) => ele.value);

    await waitFor(() => {
      expect(names[2]).toEqual('');
      expect(values[2]).toEqual('');
    });
  });

  it('should add new row with resourse and key dropdowns when (+) Add ConfigMap or Secret button is clicked', async () => {
    renderEnvironmentVariablesSection();
    const user = userEvent.setup();
    const addCMSButton = screen.getByRole('button', {
      name: /add from configmap or secret/i,
    });

    await user.click(addCMSButton);

    const resourceButton = screen.getByRole('button', { name: /select a resource/i });
    const keyButton = screen.getByRole('button', { name: /select a key/i });

    await user.click(resourceButton);

    expect(await screen.findByPlaceholderText(/configmap or secret/i)).toBeVisible();

    await user.click(keyButton);

    expect(await screen.findByPlaceholderText(/key/i)).toBeVisible();
  });

  it('should remove row when (-) button is clicked', async () => {
    renderEnvironmentVariablesSection();
    const user = userEvent.setup();
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });

    await user.click(deleteButtons[0]);

    const names = screen.getAllByPlaceholderText(/name/i).map((ele: HTMLInputElement) => ele.value);
    const values = screen
      .getAllByPlaceholderText(/value/i)
      .map((ele: HTMLInputElement) => ele.value);

    await waitFor(() => {
      expect(names).toEqual(['xyz2']);
      expect(values).toEqual(['abc2']);
    });
  });
});
