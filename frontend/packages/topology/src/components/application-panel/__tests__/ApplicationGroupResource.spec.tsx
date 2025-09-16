import * as React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { K8sResourceKind } from '@console/internal/module/k8s';
import ApplicationGroupResource from '../ApplicationGroupResource';
import '@testing-library/jest-dom';

const renderComponent = (props: React.ComponentProps<typeof ApplicationGroupResource>) => {
  return render(
    <MemoryRouter>
      <ApplicationGroupResource {...props} />
    </MemoryRouter>,
  );
};

describe('<ApplicationGroupResource />', () => {
  it('should render component when resourcesData is present', () => {
    renderComponent({
      title: 'Deployments',
      group: 'a',
      resourcesData: [{ kind: 'Deployment', metadata: { name: 'test', uid: '1' } }],
    });

    expect(screen.getByText('Deployments')).toBeInTheDocument();
  });

  it('should not render component when resourcesData is empty', () => {
    const { container } = renderComponent({
      title: 'Deployments',
      group: 'a',
      resourcesData: [],
    });

    expect(container.firstChild).toBeNull();
  });

  it('should render "View all" link if resources exceed MAX_RESOURCES', () => {
    const resources: K8sResourceKind[] = Array.from({ length: 6 }).map((_, i) => ({
      kind: 'DeploymentConfig',
      metadata: { name: `dc-${i}`, uid: `${i}` },
    }));

    renderComponent({
      title: 'Deployment Config',
      group: 'a',
      resourcesData: resources,
    });

    expect(screen.getByText('View all 6')).toBeInTheDocument();
  });

  it('should not render "View all" link if resources are within MAX_RESOURCES', () => {
    const resources: K8sResourceKind[] = [
      { kind: 'DeploymentConfig', metadata: { name: 'dc', uid: '1' } },
    ];

    renderComponent({
      title: 'Deployment Config',
      group: 'a',
      resourcesData: resources,
    });

    expect(screen.queryByText(/View all/)).not.toBeInTheDocument();
  });

  it('should render <TopologyApplicationResourceList /> if resources exist', () => {
    const resources: K8sResourceKind[] = [
      { kind: 'DeploymentConfig', metadata: { name: 'dc', uid: '1' } },
    ];

    renderComponent({
      title: 'Deployment Config',
      group: 'a',
      resourcesData: resources,
    });

    expect(screen.getByRole('link', { name: 'dc' })).toBeInTheDocument();
  });
});
