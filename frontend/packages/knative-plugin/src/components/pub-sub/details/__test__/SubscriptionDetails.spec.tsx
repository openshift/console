import * as React from 'react';
import * as _ from 'lodash';
import { shallow } from 'enzyme';
import { Conditions } from '@console/internal/components/conditions';
import SubscriptionDetails from '../SubscriptionDetails';
import { subscriptionData } from '../../../../utils/__tests__/knative-eventing-data';
import DynamicResourceLink from '../DynamicResourceLink';

describe('SubscriptionDetails', () => {
  const wrapper = shallow(<SubscriptionDetails obj={subscriptionData} />);
  it('should render two DynamicResourceLink with respective props', () => {
    const dynamicResourceLink = wrapper.find(DynamicResourceLink);
    expect(dynamicResourceLink).toHaveLength(2);
    expect(dynamicResourceLink.at(0).props().title).toEqual('Channel');
    expect(dynamicResourceLink.at(0).props().name).toEqual('testchannel');
    expect(dynamicResourceLink.at(1).props().title).toEqual('Subscriber');
    expect(dynamicResourceLink.at(1).props().name).toEqual('channel-display0');
  });

  it('should render Conditions if status is present', () => {
    expect(wrapper.find(Conditions)).toHaveLength(1);
  });

  it('should not render Conditions if status is not present', () => {
    const subscriptionDataClone = _.omit(_.cloneDeep(subscriptionData), 'status');
    const subscriptionDetailsWrapper = shallow(<SubscriptionDetails obj={subscriptionDataClone} />);
    expect(subscriptionDetailsWrapper.find(Conditions)).toHaveLength(0);
  });
});
