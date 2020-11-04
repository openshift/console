import * as React from 'react';
import * as _ from 'lodash';
import { shallow } from 'enzyme';
import { Conditions } from '@console/internal/components/conditions';
import TriggerDetails from '../TriggerDetails';
import { triggerData } from '../../../../utils/__tests__/knative-eventing-data';
import DynamicResourceLink from '../DynamicResourceLink';
import FilterTable from '../../../overview/FilterTable';

describe('SubscriptionDetails', () => {
  const wrapper = shallow(<TriggerDetails obj={triggerData} />);
  it('should render two DynamicResourceLink with respective props', () => {
    const dynamicResourceLink = wrapper.find(DynamicResourceLink);
    expect(dynamicResourceLink).toHaveLength(2);
    expect(dynamicResourceLink.at(0).props().title).toEqual('Broker');
    expect(dynamicResourceLink.at(0).props().name).toEqual('default');
    expect(dynamicResourceLink.at(1).props().title).toEqual('Subscriber');
    expect(dynamicResourceLink.at(1).props().name).toEqual('broker-display');
  });

  it('should render FilterTable if filter is present', () => {
    expect(wrapper.find(FilterTable)).toHaveLength(1);
  });

  it('should render Conditions if status is present', () => {
    expect(wrapper.find(Conditions)).toHaveLength(1);
  });

  it('should not render FilterTable if filter is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'spec.filter');
    const triggerDetailsWrapper = shallow(<TriggerDetails obj={triggerDataClone} />);
    expect(triggerDetailsWrapper.find(FilterTable)).toHaveLength(0);
  });

  it('should not render Conditions if status is not present', () => {
    const triggerDataClone = _.omit(_.cloneDeep(triggerData), 'status');
    const triggerDetailsWrapper = shallow(<TriggerDetails obj={triggerDataClone} />);
    expect(triggerDetailsWrapper.find(Conditions)).toHaveLength(0);
  });
});
