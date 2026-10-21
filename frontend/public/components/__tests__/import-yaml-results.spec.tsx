import { screen, waitFor } from '@testing-library/react';

import { renderWithProviders } from '@console/shared/src/test-utils/unit-test-utils';
import {
  ImportYAMLResults,
  ImportYAMLPageStatus,
  ImportYAMLResourceStatus,
} from '../import-yaml-results';

describe('ImportYAMLResults: test component layout', () => {
  const renderImportYAMLResults = () => {
    return renderWithProviders(
      <ImportYAMLResults
        createResources={() => Promise.resolve([])}
        displayResults={() => {
          return;
        }}
        importResources={[]}
        retryFailed={() => {
          return;
        }}
      />,
    );
  };

  it('should display the Import YAML Results page', async () => {
    renderImportYAMLResults();

    const titleElement = await screen.findByText('Creating resources...');
    expect(titleElement).toBeVisible();
  });

  it('should display table headers for resource information', async () => {
    renderImportYAMLResults();

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeVisible();
      expect(screen.getByText('Namespace')).toBeVisible();
      expect(screen.getByText('Creation status')).toBeVisible();
    });
  });

  it('should display import status as in flight by default', async () => {
    renderImportYAMLResults();

    const inFlightMessage = await screen.findByText('Creating resources...');
    expect(inFlightMessage).toBeVisible();
  });
});

describe('ImportYAMLPageStatus: user feedback during resource creation', () => {
  it('shows loading indicator and progress message while resources are being created', async () => {
    renderWithProviders(<ImportYAMLPageStatus inFlight />);

    expect(await screen.findByRole('progressbar')).toBeVisible();
    expect(screen.getByText('Creating resources...')).toBeVisible();
  });

  it('shows success message when all resources are created successfully', () => {
    renderWithProviders(<ImportYAMLPageStatus inFlight={false} />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Resources successfully created')).toBeVisible();
  });

  it('shows error message when some resources failed to be created', () => {
    renderWithProviders(<ImportYAMLPageStatus inFlight={false} errors />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('One or more resources failed to be created')).toBeVisible();
  });
});

describe('ImportYAMLResourceStatus: test resource creation status', () => {
  it('should display spinner and creating message when creating', async () => {
    renderWithProviders(<ImportYAMLResourceStatus creating message="Creating" />);

    expect(await screen.findByRole('progressbar')).toBeVisible();
    expect(screen.getByText('Creating')).toBeInTheDocument();
  });

  it('should display success message when creation is complete', () => {
    renderWithProviders(<ImportYAMLResourceStatus creating={false} message="Created" />);

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Created')).toBeVisible();
  });

  it('should display error icon and message when creation fails', () => {
    renderWithProviders(
      <ImportYAMLResourceStatus creating={false} error message="Error creating resource" />,
    );

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Error creating resource')).toBeVisible();
    expect(screen.getByRole('img', { hidden: true })).toBeVisible();
  });
});
