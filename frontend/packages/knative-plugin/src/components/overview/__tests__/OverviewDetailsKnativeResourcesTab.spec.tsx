import { render } from '@testing-library/react';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import OverviewDetailsKnativeResourcesTab from '../OverviewDetailsKnativeResourcesTab';
import '@testing-library/jest-dom';

jest.mock('@console/internal/components/utils', () => ({
  __esModule: true,
  default: 'OperatorBackedOwnerReferences',
}));

jest.mock('../ConfigurationsOverviewList', () => ({
  __esModule: true,
  default: 'ConfigurationsOverviewList',
}));

jest.mock('../RevisionsOverviewList', () => ({
  __esModule: true,
  default: 'RevisionsOverviewList',
}));

jest.mock('../RoutesOverviewList', () => ({
  __esModule: true,
  default: 'KSRoutesOverviewList',
}));

type OverviewDetailsKnativeResourcesTabProps = React.ComponentProps<
  typeof OverviewDetailsKnativeResourcesTab
>;

describe('OverviewDetailsKnativeResourcesTab', () => {
  let knItem: OverviewDetailsKnativeResourcesTabProps;

  beforeEach(() => {
    knItem = {
      item: {
        obj: MockKnativeResources.ksservices.data[0],
        configurations: MockKnativeResources.configurations.data,
        revisions: MockKnativeResources.revisions.data,
        ksservices: MockKnativeResources.ksservices.data,
        ksroutes: MockKnativeResources.ksroutes.data,
        isOperatorBackedService: false,
      },
    };
  });

  it('should render OperatorBackedOwnerReferences with proper props', () => {
    const { container } = render(<OverviewDetailsKnativeResourcesTab item={knItem.item} />);
    const operatorBacked = container.querySelector('OperatorBackedOwnerReferences');
    expect(operatorBacked).toBeInTheDocument();
    expect(operatorBacked).toHaveAttribute('item', '[object Object]');
  });

  it('should render Routes, Configuration and revision list on sidebar in case of kn deployment', () => {
    knItem.item = {
      ...knItem.item,
      obj: MockKnativeResources.deployments.data[0],
    };
    const { container } = render(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(container.querySelector('RevisionsOverviewList')).toBeInTheDocument();
    expect(container.querySelector('KSRoutesOverviewList')).toBeInTheDocument();
    expect(container.querySelector('ConfigurationsOverviewList')).toBeInTheDocument();
  });
});
