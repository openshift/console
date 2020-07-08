import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { OverviewItem } from '@console/shared';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import {
  EventSubscriptionObj,
  EventIMCObj,
  knativeServiceObj,
  EventBrokerObj,
  EventTriggerObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import EventPubSubResources, { PubSubResourceOverviewList } from '../EventPubSubResources';

type EventPubSubResourcesProps = React.ComponentProps<typeof EventPubSubResources>;
type PubSubResourceOverviewListProps = React.ComponentProps<typeof PubSubResourceOverviewList>;
let itemData: OverviewItem & {
  eventSources?: K8sResourceKind[];
  eventingsubscription?: K8sResourceKind[];
  connections?: K8sResourceKind[];
};

describe('EventPubSubResources', () => {
  let wrapper: ShallowWrapper<EventPubSubResourcesProps>;
  itemData = {
    obj: EventSubscriptionObj,
    buildConfigs: [],
    eventSources: [],
    routes: [],
    services: [],
    connections: [EventIMCObj, knativeServiceObj],
  };

  it('should render PubSubResourceOverviewList once if obj of kind Subscription', () => {
    wrapper = shallow(<EventPubSubResources item={itemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(1);
    expect(findPubSubList.at(0).props().title).toEqual('Connections');
  });

  it('should render PubSubResourceOverviewList thrice if obj not of kind Subscription', () => {
    const channelItemData = {
      ...itemData,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
    };
    wrapper = shallow(<EventPubSubResources item={channelItemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(3);
    expect(findPubSubList.at(0).props().title).toEqual('Knative Services');
    expect(findPubSubList.at(1).props().title).toEqual('Event Sources');
    expect(findPubSubList.at(2).props().title).toEqual('Subscriptions');
  });

  it('should render broker section if the kind is Broker ', () => {
    const brokerItemData = {
      ...itemData,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
      connections: [EventBrokerObj, knativeServiceObj],
    };
    wrapper = shallow(<EventPubSubResources item={brokerItemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(5);
    expect(findPubSubList.at(0).props().title).toEqual('Knative Services');
    expect(findPubSubList.at(1).props().title).toEqual('Event Sources');
    expect(findPubSubList.at(2).props().title).toEqual('Triggers');
    expect(findPubSubList.at(3).props().title).toEqual('Pods');
    expect(findPubSubList.at(4).props().title).toEqual('Deployments');
  });
});

describe('PubSubResourceOverviewList', () => {
  let wrapper: ShallowWrapper<PubSubResourceOverviewListProps>;
  const itemsData: K8sResourceKind[] = [EventIMCObj, knativeServiceObj];

  it('should render ResourceLink respective for each resources, SidebarSectionHeading and no span', () => {
    wrapper = shallow(<PubSubResourceOverviewList items={itemsData} title="Connections" />);
    const findPubSubList = wrapper.find(ResourceLink);
    expect(findPubSubList).toHaveLength(2);
    expect(findPubSubList.at(0).props().name).toEqual('testchannel');
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(wrapper.find('.text-muted').exists()).toBe(false);
  });

  it('should render SidebarSectionHeading, text-muted and not ResourceLink if no resources exists', () => {
    wrapper = shallow(<PubSubResourceOverviewList items={[]} title="Connections" />);
    const findTextMutedList = wrapper.find('.text-muted');
    expect(wrapper.find(ResourceLink).exists()).toBe(false);
    expect(wrapper.find(SidebarSectionHeading)).toHaveLength(1);
    expect(findTextMutedList.exists()).toBe(true);
  });
});
