import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import store from '@console/internal/redux';
import { Resources } from '../../import/import-types';
import {
  mockDeployment,
  mockDeploymentConfig,
  mockDeploymentConfig2,
  mockEditDeploymentData,
} from '../__mocks__/deployment-data';
import MockForm from '../__mocks__/MockForm';
import DeploymentStrategySection from '../deployment-strategy/DeploymentStrategySection';
import { convertDeploymentToEditForm } from '../utils/deployment-utils';

const handleSubmit = jest.fn();

describe('DeploymentStrategySection(DeploymentConfig)', () => {
  it('should show strategy fields based on strategy type selected', async () => {
    const user = userEvent.setup();
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
    );

    expect(await screen.findByTestId('rollingParams')).toBeVisible();

    const strategyDropdown = screen.getByRole('button', {
      name: /strategy type/i,
    });

    await user.click(strategyDropdown);

    const recreateButton = screen.getByRole('option', { name: /recreate/i });

    await user.click(recreateButton);

    expect(await screen.findByTestId('recreateParams')).toBeVisible();

    await user.click(strategyDropdown);

    const customButton = screen.getByRole('option', { name: /custom/i });

    await user.click(customButton);

    expect(await screen.findByTestId('customParams')).toBeVisible();
  });

  it('should render additional fields for Recreate strategy type', async () => {
    const user = userEvent.setup();
    render(
      <MockForm
        handleSubmit={handleSubmit}
        initialValues={{
          ...mockEditDeploymentData,
          formData: convertDeploymentToEditForm(mockDeploymentConfig2),
        }}
        enableReinitialize
      >
        {() => (
          <Provider store={store}>
            <DeploymentStrategySection
              resourceObj={mockDeploymentConfig2}
              resourceType={Resources.OpenShift}
            />
          </Provider>
        )}
      </MockForm>,
    );

    const strategyDropdown = screen.getByRole('button', {
      name: /strategy type/i,
    });

    await user.click(strategyDropdown);

    const recreateButton = screen.getByRole('option', { name: /recreate/i });

    await user.click(recreateButton);

    expect(await screen.findByTestId('recreateParams')).toBeVisible();

    const advancedSection = screen.getByText('Show additional parameters and lifecycle hooks');

    await user.click(advancedSection);

    expect(await screen.findByText('Pre Lifecycle Hook')).toBeVisible();
    expect(await screen.findByText('Mid Lifecycle Hook')).toBeVisible();
    expect(await screen.findByText('Post Lifecycle Hook')).toBeVisible();

    const addMidLifecycleHook = screen.getByText('Add mid lifecycle hook');

    await user.click(addMidLifecycleHook);

    expect(
      await screen.findByText(
        'Runs a command in a new pod using the container from the deployment template. You can add additional environment variables and volumes',
      ),
    ).toBeVisible();

    let action = screen.getByText(
      'Runs a command in a new pod using the container from the deployment template. You can add additional environment variables and volumes',
    );
    await user.click(action);

    expect(await screen.findByText('Container name')).toBeVisible();
    expect(await screen.findByText('Command')).toBeVisible();

    action = screen.getByText(
      'Tags the current image as an image stream tag if the deployment succeeds',
    );
    await user.click(action);

    expect(await screen.findByText('Container name')).toBeVisible();
    expect(await screen.findByText('Tag as')).toBeVisible();
  });
});

describe('DeploymentStrategySection(Deployment)', () => {
  it('should show strategy fields based on strategy type selected', async () => {
    const user = userEvent.setup();
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
    );

    const strategyDropdown = screen.getByRole('button', {
      name: /strategy type/i,
    });

    expect(await screen.findByTestId('rollingUpdate')).toBeVisible();

    await user.click(strategyDropdown);

    const recreateButton = screen.getByRole('option', { name: /recreate/i });

    await user.click(recreateButton);

    await waitFor(() => {
      expect(screen.queryByTestId('recreateParams')).not.toBeInTheDocument();
    });

    await user.click(strategyDropdown);

    await waitFor(() => {
      expect(screen.queryByRole('option', { name: /custom/i })).not.toBeInTheDocument();
    });
  });
});
