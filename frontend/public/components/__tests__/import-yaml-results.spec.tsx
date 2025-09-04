import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ImportYAMLResults,
  ImportYAMLPageStatus,
  ImportYAMLResourceStatus,
} from '../import-yaml-results';

describe('ImportYAMLResults: test component layout', () => {
  const renderImportYAMLResults = () => {
    return render(
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

  it('should display the Import YAML Results page', () => {
    renderImportYAMLResults();

    // User should see the Import YAML Results page rendered
    expect(screen.getByText('Import YAML Results')).toBeInTheDocument();
  });

  it('should display table headers for resource information', () => {
    renderImportYAMLResults();

    // User should see table column headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Namespace')).toBeInTheDocument();
    expect(screen.getByText('Creation status')).toBeInTheDocument();
  });

  it('should display import status as in flight by default', () => {
    renderImportYAMLResults();

    // User should see loading state initially
    expect(screen.getByText('Creating resources...')).toBeInTheDocument();
  });
});

describe('ImportYAMLPageStatus: test loading state', () => {
  it('should display spinner and creating message when in flight', () => {
    render(<ImportYAMLPageStatus inFlight={true} />);

    // User should see loading spinner and creating message
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Creating resources...')).toBeInTheDocument();
  });

  it('should display success message when not in flight and no errors', () => {
    render(<ImportYAMLPageStatus inFlight={false} />);

    // User should see success message and no spinner
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Resources successfully created')).toBeInTheDocument();
  });

  it('should display error message when errors exist', () => {
    render(<ImportYAMLPageStatus inFlight={false} errors={true} />);

    // User should see error message and no spinner
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('One or more resources failed to be created')).toBeInTheDocument();
  });
});

describe('ImportYAMLResourceStatus: test resource creation status', () => {
  it('should display spinner and creating message when creating', () => {
    render(<ImportYAMLResourceStatus creating={true} message="Creating" />);

    // User should see spinner and creating message
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('Creating')).toBeInTheDocument();
  });

  it('should display success message when creation is complete', () => {
    render(<ImportYAMLResourceStatus creating={false} message="Created" />);

    // User should see success message and no spinner
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Created')).toBeInTheDocument();
  });

  it('should display error icon and message when creation fails', () => {
    render(
      <ImportYAMLResourceStatus creating={false} error={true} message="Error creating resource" />,
    );

    // User should see error icon and error message
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByText('Error creating resource')).toBeInTheDocument();
    // Error icon should be present (SVG or similar)
    expect(document.querySelector('svg')).toBeInTheDocument();
  });
});
