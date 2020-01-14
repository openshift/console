import * as React from 'react';
import { shallow } from 'enzyme';
import { MockKnativeResources } from '@console/dev-console/src/components/topology/__tests__/topology-knative-test-data';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import OverviewDetailsKnativeResourcesTab from '../OverviewDetailsKnativeResourcesTab';
import KnativeServiceResources from '../KnativeServiceResources';
import KnativeRevisionResources from '../KnativeRevisionResources';
import EventSinkServicesOverviewList from '../EventSinkServicesOverviewList';

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
        buildConfigs: [],
        routes: [],
        services: [],
        isOperatorBackedService: false,
      },
    };
  });
  it('should render KnativeServiceResources on sidebar', () => {
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(KnativeServiceResources)).toHaveLength(1);
  });

  it('should render KnativeRevisionResources on sidebar', () => {
    knItem.item = { ...knItem.item, ...{ obj: MockKnativeResources.revisions.data[0] } };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(KnativeRevisionResources)).toHaveLength(1);
  });

  it('should render EventSinkServicesOverviewList on sidebar', () => {
    knItem.item = { ...knItem.item, ...{ obj: MockKnativeResources.eventSourceCronjob.data[0] } };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventSinkServicesOverviewList)).toHaveLength(1);
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
});
