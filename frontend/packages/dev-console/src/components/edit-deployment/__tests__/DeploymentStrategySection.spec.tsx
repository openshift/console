import * as React from 'react';
import { cleanup, fireEvent, render, screen, waitFor, configure } from '@testing-library/react';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { Resources } from '../../import/import-types';
import {
  mockDeployment,
  mockDeploymentConfig,
  mockEditDeploymentData,
} from '../__mocks__/edit-deployment-data';
import MockForm from '../__mocks__/MockForm';
import DeploymentStrategySection from '../deployment-strategy/DeploymentStrategySection';
import { convertDeploymentToEditForm } from '../utils/edit-deployment-utils';

configure({ testIdAttribute: 'data-test' });

const handleSubmit = jest.fn();

afterEach(() => cleanup());

describe('DeploymentStrategySection(DeploymentConfig)', () => {
  it('should show strategy fields based on strategy type selected', async () => {
    await waitFor(() =>
      render(
        <MockForm handleSubmit={handleSubmit} enableReinitialize>
          {() => (
            <Provider store={store}>
              <DeploymentStrategySection
                resourceObj={mockDeploymentConfig}
                resourceType={Resources.OpenShift}
              />
            </Provider>
          )}
        </MockForm>,
      ),
    );
    const strategyDropdown = screen.getByRole('button', {
      name: /strategy type/i,
    });

    expect(screen.queryByTestId('rollingParams')).not.toBeNull();

    fireEvent.click(strategyDropdown);

    const recreateButton = screen.getByRole('button', { name: /recreate/i });

    fireEvent.click(recreateButton);

    await waitFor(() => {
      expect(screen.queryByTestId('recreateParams')).not.toBeNull();
    });

    fireEvent.click(strategyDropdown);

    const customButton = screen.getByRole('button', { name: /custom/i });

    fireEvent.click(customButton);

    await waitFor(() => {
      expect(screen.queryByTestId('customParams')).not.toBeNull();
    });
  });
});

describe('DeploymentStrategySection(Deployment)', () => {
  it('should show strategy fields based on strategy type selected', async () => {
    await waitFor(() =>
      render(
        <MockForm
          initialValues={{
            ...mockEditDeploymentData,
            formData: convertDeploymentToEditForm(mockDeployment),
          }}
          handleSubmit={handleSubmit}
          enableReinitialize
        >
          {() => (
            <Provider store={store}>
              <DeploymentStrategySection
                resourceObj={mockDeployment}
                resourceType={Resources.Kubernetes}
              />
            </Provider>
          )}
        </MockForm>,
      ),
    );

    const strategyDropdown = screen.getByRole('button', {
      name: /strategy type/i,
    });

    await waitFor(() => expect(screen.queryByTestId('rollingUpdate')).not.toBeNull());

    fireEvent.click(strategyDropdown);

    const recreateButton = screen.getByRole('button', { name: /recreate/i });

    fireEvent.click(recreateButton);

    await waitFor(() => {
      expect(screen.queryByTestId('recreateParams')).toBeNull();
    });

    fireEvent.click(strategyDropdown);

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /custom/i })).toBeNull();
    });
  });
});
