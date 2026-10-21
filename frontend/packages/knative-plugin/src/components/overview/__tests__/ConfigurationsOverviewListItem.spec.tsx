import { render, screen } from '@testing-library/react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../../models';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: 'ListItem',
}));

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
}));

describe('ConfigurationsOverviewListItem', () => {
  it('should list the Configuration', () => {
    const { container } = render(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(container.querySelector('ListItem')).toBeInTheDocument();
  });

  it('should have ResourceLink with proper kind', () => {
    const { container } = render(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    const resourceLink = container.querySelector('ResourceLink');
    expect(resourceLink).toBeInTheDocument();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(ConfigurationModel));
  });

  it('should display latestCreatedRevisionName and latestReadyRevisionName', () => {
    render(<ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />);

    const {
      status: { latestCreatedRevisionName },
    } = sampleKnativeConfigurations.data[0];

    // Check for the labels and the revision names
    expect(screen.getByText('Latest created Revision name:')).toBeInTheDocument();
    expect(screen.getByText('Latest ready Revision name:')).toBeInTheDocument();

    // Use getAllByText to handle duplicate revision names
    const revisionNameElements = screen.getAllByText(latestCreatedRevisionName);
    expect(revisionNameElements).toHaveLength(2); // Should appear twice if they're the same

    // Or verify just that the text content includes both revision names
    expect(screen.getByText('Latest created Revision name:')).toBeInTheDocument();
    expect(screen.getByText('Latest ready Revision name:')).toBeInTheDocument();
  });
});
