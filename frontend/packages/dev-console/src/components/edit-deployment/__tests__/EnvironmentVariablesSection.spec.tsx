import * as React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, configure } from '@testing-library/react';
import * as _ from 'lodash';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { mockEditDeploymentData, mockDeploymentConfig } from '../__mocks__/edit-deployment-data';
import MockForm from '../__mocks__/MockForm';
import ContainerField from '../ContainerField';
import EnvironmentVariablesSection from '../EnvironmentVariablesSection';

configure({ testIdAttribute: 'data-test' });

const MockContainerField: React.FC = () => <div>Container: foo</div>;

jest.mock('../ContainerField', () => ({
  __esModule: true,
  namedExport: jest.fn(),
  default: jest.fn(),
}));

const mockedContainerField = ContainerField as jest.Mock<React.FC>;
const handleSubmit = jest.fn();
const mockInitialValues = _.cloneDeep(mockEditDeploymentData);
mockInitialValues.formData.envs = [
  { name: 'xyz', value: 'abc' },
  { name: 'xyz2', value: 'abc2' },
];

beforeAll(() => {
  mockedContainerField.mockImplementation(MockContainerField);
});

beforeEach(() =>
  render(
    <MockForm initialValues={mockInitialValues} handleSubmit={handleSubmit}>
      {() => (
        <Provider store={store}>
          <EnvironmentVariablesSection resourceObj={mockDeploymentConfig} />
        </Provider>
      )}
    </MockForm>,
  ),
);

afterEach(() => cleanup());

describe('EnvironmentVariablesSection', () => {
  it('should show initial name value pairs', async () => {
    const names = screen.getAllByPlaceholderText(/name/i).map((ele: HTMLInputElement) => ele.value);
    const values = screen
      .getAllByPlaceholderText(/value/i)
      .map((ele: HTMLInputElement) => ele.value);
    expect(names).toEqual(['xyz', 'xyz2']);
    expect(values).toEqual(['abc', 'abc2']);
  });

  it('should add a new row when (+) Add button is clicked', async () => {
    const addButton = screen.getByRole('button', { name: /add value/i });

    fireEvent.click(addButton);

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
    const addCMSButton = screen.getByRole('button', {
      name: /public~add from configmap or secret/i,
    });

    fireEvent.click(addCMSButton);

    const resourceButton = screen.getByRole('button', { name: /select a resource/i });
    const keyButton = screen.getByRole('button', { name: /select a key/i });

    fireEvent.click(resourceButton);

    const resourceDropdown = screen.queryByPlaceholderText(/configmap or secret/i);
    await waitFor(() => expect(resourceDropdown).not.toBeNull());

    fireEvent.click(keyButton);

    const keyDropdown = screen.queryByPlaceholderText(/key/i);
    await waitFor(() => expect(keyDropdown).not.toBeNull());
  });

  it('should remove row when (-) button is clicked', async () => {
    const deleteButtons = screen.getAllByRole('button', { name: /public~delete/i });

    fireEvent.click(deleteButtons[0]);

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
