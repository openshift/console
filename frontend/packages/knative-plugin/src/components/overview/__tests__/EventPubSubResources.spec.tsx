import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import {
  EventSubscriptionObj,
  EventIMCObj,
  knativeServiceObj,
  EventBrokerObj,
  EventTriggerObj,
} from '@console/knative-plugin/src/topology/__tests__/topology-knative-test-data';
import type { Subscriber } from '@console/knative-plugin/src/topology/topology-types';
import EventPubSubResources, { PubSubResourceOverviewList } from '../EventPubSubResources';

jest.mock(
  '@console/internal/components/utils',
  () =>
    jest.requireActual('@console/knative-plugin/src/__tests__/rtl-stub-components')
      .knativeInternalUtilsStubs,
);

jest.mock('../EventPubSubSubscribers', () => ({
  __esModule: true,
  default: () => <div data-test="mock-PubSubSubscribers" />,
}));

type EventPubSubResourcesProps = ComponentProps<typeof EventPubSubResources>;
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
  sampleItemData = {
    item: {
      obj: EventSubscriptionObj,
      eventSources: [],
      subscribers: sampleSubscribers,
    },
  };

  it('should render related resources for the Subscription', () => {
    render(<EventPubSubResources item={sampleItemData.item} />);
    expect(screen.getAllByTestId('mock-SidebarSectionHeading')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Event Sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Channel' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Subscriber' })).toBeInTheDocument();
  });

  it('should render related resources for channel without subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
    };
    render(<EventPubSubResources item={channelItemData} />);
    expect(screen.getAllByTestId('mock-SidebarSectionHeading')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Event Sources' })).toBeInTheDocument();
  });

  it('should render related resources for channel with subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
      subscribers: sampleSubscribers,
    };
    render(<EventPubSubResources item={channelItemData} />);
    expect(screen.getAllByTestId('mock-SidebarSectionHeading')).toHaveLength(1);
    expect(screen.getByRole('heading', { name: 'Event Sources' })).toBeInTheDocument();
    expect(screen.getAllByTestId('mock-PubSubSubscribers')).toHaveLength(1);
  });

  it('should render broker section if the kind is Broker and  without subscribers ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
    };
    render(<EventPubSubResources item={brokerItemData} />);
    expect(screen.getAllByTestId('mock-SidebarSectionHeading')).toHaveLength(3);
    expect(screen.getByRole('heading', { name: 'Event Sources' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Pods' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Deployments' })).toBeInTheDocument();
  });

  it('should render broker section with Subscribers if the kind is Broker and subscribers available ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
      subscribers: sampleSubscribers,
    };
    render(<EventPubSubResources item={brokerItemData} />);
    expect(screen.getAllByTestId('mock-PubSubSubscribers')).toHaveLength(1);
    expect(screen.getAllByTestId('mock-SidebarSectionHeading')).toHaveLength(3);
  });
});

describe('PubSubResourceOverviewList', () => {
  const itemsData: K8sResourceKind[] = [EventIMCObj, knativeServiceObj];

  it('should render ResourceLink respective for each resources, SidebarSectionHeading and no span', () => {
    render(<PubSubResourceOverviewList items={itemsData} title="Connections" />);
    const resourceLinks = screen.getAllByTestId('mock-ResourceLink');
    expect(resourceLinks).toHaveLength(2);
    expect(resourceLinks[0]).toHaveAttribute('name', 'testchannel');
    expect(screen.getByTestId('mock-SidebarSectionHeading')).toBeVisible();
    expect(screen.queryByText('No Connections found for this resource.')).not.toBeInTheDocument();
  });

  it('should render SidebarSectionHeading, pf-v6-u-text-color-subtle and not ResourceLink if no resources exists', () => {
    render(<PubSubResourceOverviewList items={[]} title="Connections" />);
    expect(screen.queryByTestId('mock-ResourceLink')).not.toBeInTheDocument();
    expect(screen.getByTestId('mock-SidebarSectionHeading')).toBeVisible();
    expect(screen.getByText('No Connections found for this resource.')).toBeInTheDocument();
  });
});
