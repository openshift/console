import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
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
import PubSubSubscribers from '../EventPubSubSubscribers';
import { Subscriber } from 'packages/knative-plugin/src/topology/topology-types';

type EventPubSubResourcesProps = React.ComponentProps<typeof EventPubSubResources>;
type PubSubResourceOverviewListProps = React.ComponentProps<typeof PubSubResourceOverviewList>;
let sampleItemData: EventPubSubResourcesProps;

const sampleSubscribers: Subscriber[] = [
  {
    name: 'subscriber',
    kind: 'Service',
    namespace: 'ns',
    data: [
      {
        name: 'subcribedVia',
        namespace: 'ns',
        kind: 'Trigger',
        filters: [{ key: 'type', value: 'value' }],
      },
    ],
  },
];

describe('EventPubSubResources', () => {
  let wrapper: ShallowWrapper<EventPubSubResourcesProps>;
  sampleItemData = {
    item: {
      obj: EventSubscriptionObj,
      buildConfigs: [],
      eventSources: [],
      routes: [],
      services: [],
      subscribers: sampleSubscribers,
    },
  };

  it('should render related resources for the Subscription', () => {
    wrapper = shallow(<EventPubSubResources item={sampleItemData.item} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(3);
    expect(findPubSubList.at(0).props().title).toEqual('Event Sources');
    expect(findPubSubList.at(1).props().title).toEqual('Channel');
    expect(findPubSubList.at(2).props().title).toEqual('Subscriber');
  });

  it('should render related resources for channel without subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
    };
    wrapper = shallow(<EventPubSubResources item={channelItemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(1);
    expect(findPubSubList.at(0).props().title).toEqual('Event Sources');
  });

  it('should render related resources for channel with subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
      subscribers: sampleSubscribers,
    };
    wrapper = shallow(<EventPubSubResources item={channelItemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    const findPubSubSubscriberList = wrapper.find(PubSubSubscribers);
    expect(findPubSubList).toHaveLength(1);
    expect(findPubSubList.at(0).props().title).toEqual('Event Sources');
    expect(findPubSubSubscriberList).toHaveLength(1);
    expect(
      findPubSubSubscriberList
        .dive()
        .find(SidebarSectionHeading)
        .props().text,
    ).toEqual('Subscribers');
  });

  it('should render broker section if the kind is Broker and  without subscribers ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
    };
    wrapper = shallow(<EventPubSubResources item={brokerItemData} />);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(3);
    expect(findPubSubList.at(0).props().title).toEqual('Event Sources');
    expect(findPubSubList.at(1).props().title).toEqual('Pods');
    expect(findPubSubList.at(2).props().title).toEqual('Deployments');
  });

  it('should render broker section with Subscribers if the kind is Broker and subscribers available ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
      subscribers: sampleSubscribers,
    };
    wrapper = shallow(<EventPubSubResources item={brokerItemData} />);
    const findPubSubSubscriberList = wrapper.find(PubSubSubscribers);
    const findPubSubList = wrapper.find(PubSubResourceOverviewList);
    expect(findPubSubList).toHaveLength(3);
    expect(findPubSubSubscriberList).toHaveLength(1);
    expect(
      findPubSubSubscriberList
        .dive()
        .find(SidebarSectionHeading)
        .props().text,
    ).toEqual('Subscribers');
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
