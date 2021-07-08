import * as React from 'react';
import { shallow } from 'enzyme';
import OperatorBackedOwnerReferences from '@console/internal/components/utils';
import { EventSourceCronJobModel } from '../../../models';
import {
  MockKnativeResources,
  getEventSourceResponse,
  sampleEventSourceSinkbinding,
  sampleSourceKameletBinding,
  EventIMCObj,
  EventSubscriptionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import * as fetchDynamicEventSources from '../../../utils/fetch-dynamic-eventsources-utils';
import ConfigurationsOverviewList from '../ConfigurationsOverviewList';
import EventPubSubResources from '../EventPubSubResources';
import EventSourceResources from '../EventSourceResources';
import KnativeRevisionResources from '../KnativeRevisionResources';
import KnativeServiceResources from '../KnativeServiceResources';
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
  it('should render KnativeServiceResources on sidebar', () => {
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(KnativeServiceResources)).toHaveLength(1);
  });

  it('should render KnativeRevisionResources on sidebar', () => {
    knItem.item = { ...knItem.item, ...{ obj: MockKnativeResources.revisions.data[0] } };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(KnativeRevisionResources)).toHaveLength(1);
  });

  it('should render EventSourceResources on sidebar', () => {
    jest
      .spyOn(fetchDynamicEventSources, 'isDynamicEventResourceKind')
      .mockImplementationOnce(() => true);
    knItem.item = {
      ...knItem.item,
      ...{ obj: getEventSourceResponse(EventSourceCronJobModel).data[0] },
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventSourceResources)).toHaveLength(1);
  });

  it('should render EventSourceResources on sidebar for sinkBinding', () => {
    jest
      .spyOn(fetchDynamicEventSources, 'isDynamicEventResourceKind')
      .mockImplementationOnce(() => true);
    knItem.item = {
      ...knItem.item,
      ...{ obj: sampleEventSourceSinkbinding.data[0] },
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventSourceResources)).toHaveLength(1);
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

  it('should render EventPubSubResources on sidebar for Subscription', () => {
    knItem.item = {
      ...knItem.item,
      ...{ obj: EventSubscriptionObj },
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventPubSubResources)).toHaveLength(1);
  });

  it('should render EventPubSubResources on sidebar for channel', () => {
    jest
      .spyOn(fetchDynamicEventSources, 'isEventingChannelResourceKind')
      .mockImplementationOnce(() => true);
    knItem.item = {
      ...knItem.item,
      ...{ obj: EventIMCObj },
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventPubSubResources)).toHaveLength(1);
  });

  it('should render EventSourceResources on sidebar for KameletBinding', () => {
    knItem.item = {
      ...knItem.item,
      ...{ obj: sampleSourceKameletBinding.data[0] },
    };
    const wrapper = shallow(<OverviewDetailsKnativeResourcesTab {...knItem} />);
    expect(wrapper.find(EventSourceResources)).toHaveLength(1);
  });
});
