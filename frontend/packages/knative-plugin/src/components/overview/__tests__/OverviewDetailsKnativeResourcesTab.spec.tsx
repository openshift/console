import * as React from 'react';
import { shallow } from 'enzyme';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { MockKnativeResources } from '../../../topology/__tests__/topology-knative-test-data';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import OverviewDetailsKnativeResourcesTab from '../OverviewDetailsKnativeResourcesTab';
import RevisionsOverviewList from '../RevisionsOverviewList';
import KSRoutesOverviewList from '../RoutesOverviewList';

type OverviewDetailsKnativeResourcesTabProps = React.ComponentProps<
  typeof OverviewDetailsKnativeResourcesTab
>;
let knItem: OverviewDetailsKnativeResourcesTabProps;
describe('OverviewDetailsKnativeResourcesTab', () => {
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
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab item={knItem.item} />);
    expect(wrapper.find(OperatorBackedOwnerReferences)).toHaveLength(1);
    expect(
      wrapper
        .find(OperatorBackedOwnerReferences)
        .at(0)
        .props().item,
    ).toEqual(knItem.item);
  });
  it('should render Routes, Configuration and revision list on sidebar in case of kn deployment', () => {
    knItem.item = {
      ...knItem.item,
      obj: MockKnativeResources.deployments.data[0],
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(RevisionsOverviewList)).toHaveLength(1);
    expect(wrapper.find(KSRoutesOverviewList)).toHaveLength(1);
    expect(wrapper.find(ConfigurationsOverviewList)).toHaveLength(1);
  });
});
