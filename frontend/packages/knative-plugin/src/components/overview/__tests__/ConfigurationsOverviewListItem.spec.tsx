import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
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
    const { container } = render(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(
      container
        .querySelector('span')
        ?.textContent.includes(
          sampleKnativeConfigurations.data[0].status?.latestCreatedRevisionName ?? '',
        ),
    ).toBe(true);
    expect(
      container
        .querySelector('span')
        ?.textContent.includes(
          sampleKnativeConfigurations.data[0].status?.latestReadyRevisionName ?? '',
        ),
    ).toBe(true);
  });
});
