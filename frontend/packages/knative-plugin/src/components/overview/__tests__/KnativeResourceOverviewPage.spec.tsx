import * as React from 'react';
import { shallow } from 'enzyme';
import { OverviewItem } from '@console/shared';
import { LoadingBox } from '@console/internal/components/utils';
import { ResourceOverviewDetails } from '@console/internal/components/overview/resource-overview-details';
import {
  revisionObj,
  EventSubscriptionObj,
} from '../../../topology/__tests__/topology-knative-test-data';
import { RevisionModel, EventingSubscriptionModel } from '../../../models';
import { KnativeResourceOverviewPage } from '../KnativeResourceOverviewPage';
import SinkUriResourcesTab from '../SinkUriResourcesTab';
import { NodeType } from '../../../topology/knative-topology-utils';

describe('KnativeResourceOverviewPage', () => {
  let item: OverviewItem;
  beforeEach(() => {
    item = {
      buildConfigs: [],
      obj: revisionObj,
      routes: [],
      services: [],
    };
  });

  it('should not render if kindsInFlight is true and knativeModels is empty', () => {
    const wrapper = shallow(<KnativeResourceOverviewPage item={item} kindsInFlight />);
    expect(wrapper.isEmptyRender()).toBe(true);
  });
  it('should render LoadingBox kindsInFlight is true and knativeModels is not empty', () => {
    const wrapper = shallow(
      <KnativeResourceOverviewPage item={item} knativeModels={[RevisionModel]} kindsInFlight />,
    );
    expect(wrapper.find(LoadingBox)).toHaveLength(1);
  });
  it('should render ResourceOverviewDetails kindsInFlight is false', () => {
    const wrapper = shallow(
      <KnativeResourceOverviewPage
        item={item}
        knativeModels={[RevisionModel]}
        kindsInFlight={false}
      />,
    );
    expect(wrapper.find(ResourceOverviewDetails)).toHaveLength(1);
  });
  it('should render ResourceOverviewDetails for subscription with proper action menu', () => {
    const itemData = { ...item, ...{ obj: EventSubscriptionObj } };
    const wrapper = shallow(
      <KnativeResourceOverviewPage
        item={itemData}
        knativeModels={[EventingSubscriptionModel]}
        kindsInFlight={false}
      />,
    );
    const resourceOverviewDetails = wrapper.find(ResourceOverviewDetails);
    expect(resourceOverviewDetails).toHaveLength(1);
    expect(resourceOverviewDetails.at(0).props().menuActions).toHaveLength(4);
    expect(resourceOverviewDetails.at(0).props().kindObj).toEqual(EventingSubscriptionModel);
  });

  it('should render SinkUriResourcesTab if NodeType is sink-uri', () => {
    const itemData = {
      ...item,
      obj: {
        metadata: {
          uid: '02c34a0e-9638-11e9-b134-06a61d886b62_nodesinkuri',
        },
        spec: { sinkUri: 'http://overlayimage.testproject3.svc.cluster.local' },
        type: { nodeType: NodeType.SinkUri },
      },
    };
    const wrapper = shallow(
      <KnativeResourceOverviewPage item={itemData} knativeModels={[RevisionModel]} kindsInFlight />,
    );
    expect(wrapper.find(SinkUriResourcesTab)).toHaveLength(1);
  });
});
