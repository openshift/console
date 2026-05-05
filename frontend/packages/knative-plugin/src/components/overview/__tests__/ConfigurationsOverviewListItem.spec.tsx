import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { referenceForModel } from '@console/internal/module/k8s';
import { ConfigurationModel } from '../../../models';
import { sampleKnativeConfigurations } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewListItem from '../ConfigurationsOverviewListItem';

jest.mock('@patternfly/react-core', () => ({
  ListItem: ({ children }: { children?: ReactNode }) => (
    <div data-test="mock-ListItem">{children}</div>
  ),
}));

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

describe('ConfigurationsOverviewListItem', () => {
  it('should list the Configuration', () => {
    render(<ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />);
    expect(screen.getByTestId('mock-ListItem')).toBeVisible();
  });

  it('should have ResourceLink with proper kind', () => {
    render(<ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />);
    const resourceLink = screen.getByTestId('mock-ResourceLink');
    expect(resourceLink).toBeVisible();
    expect(resourceLink).toHaveAttribute('kind', referenceForModel(ConfigurationModel));
  });

  it('should display latestCreatedRevisionName and latestReadyRevisionName', () => {
    render(<ConfigurationsOverviewListItem configuration={sampleKnativeConfigurations.data[0]} />);

    const {
      status: { latestCreatedRevisionName },
    } = sampleKnativeConfigurations.data[0];

    expect(screen.getByText('Latest created Revision name:')).toBeInTheDocument();
    expect(screen.getByText('Latest ready Revision name:')).toBeInTheDocument();

    const revisionNameElements = screen.getAllByText(latestCreatedRevisionName);
    expect(revisionNameElements).toHaveLength(2);

    expect(screen.getByText('Latest created Revision name:')).toBeInTheDocument();
    expect(screen.getByText('Latest ready Revision name:')).toBeInTheDocument();
  });
});
