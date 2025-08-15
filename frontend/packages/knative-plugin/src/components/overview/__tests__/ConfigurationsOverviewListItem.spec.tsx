import { render } from '@testing-library/react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../../models';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';
import '@testing-library/jest-dom';
import { shallow } from 'enzyme';

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
    const wrapper = shallow(
      <ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />,
    );
    expect(
      wrapper
        .find('span')
        .at(1)
        .text()
        .includes(sampleKnativeConfigurations.data[0].status?.latestCreatedRevisionName ?? ''),
    ).toBe(true);
    expect(
      wrapper
        .find('span')
        .at(3)
        .text()
        .includes(sampleKnativeConfigurations.data[0].status?.latestReadyRevisionName ?? ''),
    ).toBe(true);
  });
});
