import { render } from '@testing-library/react';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import type { Subscriber } from 'packages/knative-plugin/src/topology/topology-types';
import {
  EventSubscriptionObj,
  EventIMCObj,
  knativeServiceObj,
  EventBrokerObj,
  EventTriggerObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import EventPubSubResources, { PubSubResourceOverviewList } from '../EventPubSubResources';

jest.mock('@console/internal/components/utils', () => ({
  ResourceLink: 'ResourceLink',
  SidebarSectionHeading: 'SidebarSectionHeading',
}));

jest.mock('../EventPubSubSubscribers', () => ({
  __esModule: true,
  default: 'PubSubSubscribers',
}));

type EventPubSubResourcesProps = React.ComponentProps<typeof EventPubSubResources>;
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
    const { container } = render(<EventPubSubResources item={sampleItemData.item} />);
    const sidebarHeadings = container.querySelectorAll('SidebarSectionHeading');
    expect(sidebarHeadings).toHaveLength(3);
    expect(
      container.querySelector('SidebarSectionHeading[text="Event Sources"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('SidebarSectionHeading[text="Channel"]')).toBeInTheDocument();
    expect(container.querySelector('SidebarSectionHeading[text="Subscriber"]')).toBeInTheDocument();
  });

  it('should render related resources for channel without subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
    };
    const { container } = render(<EventPubSubResources item={channelItemData} />);
    const sidebarHeadings = container.querySelectorAll('SidebarSectionHeading');
    expect(sidebarHeadings).toHaveLength(1); // Only Event Sources
    expect(
      container.querySelector('SidebarSectionHeading[text="Event Sources"]'),
    ).toBeInTheDocument();
  });

  it('should render related resources for channel with subscribers', () => {
    const channelItemData = {
      ...sampleItemData.item,
      obj: EventIMCObj,
      ksservices: [knativeServiceObj],
      eventingsubscription: [EventSubscriptionObj],
      subscribers: sampleSubscribers,
    };
    const { container } = render(<EventPubSubResources item={channelItemData} />);
    const sidebarHeadings = container.querySelectorAll('SidebarSectionHeading');
    const pubSubSubscribers = container.querySelectorAll('PubSubSubscribers');
    expect(sidebarHeadings).toHaveLength(1); // Only Event Sources (PubSubSubscribers doesn't add SidebarSectionHeading to the count)
    expect(
      container.querySelector('SidebarSectionHeading[text="Event Sources"]'),
    ).toBeInTheDocument();
    expect(pubSubSubscribers).toHaveLength(1);
  });

  it('should render broker section if the kind is Broker and  without subscribers ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
    };
    const { container } = render(<EventPubSubResources item={brokerItemData} />);
    const sidebarHeadings = container.querySelectorAll('SidebarSectionHeading');
    expect(sidebarHeadings).toHaveLength(3); // Event Sources + Pods + Deployments
    expect(
      container.querySelector('SidebarSectionHeading[text="Event Sources"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('SidebarSectionHeading[text="Pods"]')).toBeInTheDocument();
    expect(
      container.querySelector('SidebarSectionHeading[text="Deployments"]'),
    ).toBeInTheDocument();
  });

  it('should render broker section with Subscribers if the kind is Broker and subscribers available ', () => {
    const brokerItemData = {
      ...sampleItemData.item,
      obj: EventBrokerObj,
      ksservices: [knativeServiceObj],
      triggers: [EventTriggerObj],
      subscribers: sampleSubscribers,
    };
    const { container } = render(<EventPubSubResources item={brokerItemData} />);
    const pubSubSubscribers = container.querySelectorAll('PubSubSubscribers');
    const sidebarHeadings = container.querySelectorAll('SidebarSectionHeading');
    expect(sidebarHeadings).toHaveLength(3); // Event Sources + Pods + Deployments (PubSubSubscribers doesn't add to count)
    expect(pubSubSubscribers).toHaveLength(1);
  });
});

describe('PubSubResourceOverviewList', () => {
  const itemsData: K8sResourceKind[] = [EventIMCObj, knativeServiceObj];

  it('should render ResourceLink respective for each resources, SidebarSectionHeading and no span', () => {
    const { container } = render(
      <PubSubResourceOverviewList items={itemsData} title="Connections" />,
    );
    const resourceLinks = container.querySelectorAll('ResourceLink');
    expect(resourceLinks).toHaveLength(2);
    expect(resourceLinks[0]).toHaveAttribute('name', 'testchannel');
    expect(container.querySelector('SidebarSectionHeading')).toBeInTheDocument();
    expect(container.querySelector('.pf-v6-u-text-color-subtle')).not.toBeInTheDocument();
  });

  it('should render SidebarSectionHeading, pf-v6-u-text-color-subtle and not ResourceLink if no resources exists', () => {
    const { container } = render(<PubSubResourceOverviewList items={[]} title="Connections" />);
    expect(container.querySelector('ResourceLink')).not.toBeInTheDocument();
    expect(container.querySelector('SidebarSectionHeading')).toBeInTheDocument();
    expect(container.querySelector('.pf-v6-u-text-color-subtle')).toBeInTheDocument();
  });
});
