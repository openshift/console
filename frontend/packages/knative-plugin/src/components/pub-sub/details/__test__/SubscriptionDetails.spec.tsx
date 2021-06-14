import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { Conditions } from '@console/internal/components/conditions';
import { subscriptionData } from '../../../../utils/__tests__/knative-eventing-data';
import DynamicResourceLink from '../DynamicResourceLink';
import SubscriptionDetails from '../SubscriptionDetails';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const i18nNS = 'knative-plugin';

describe('SubscriptionDetails', () => {
  const wrapper = shallow(<SubscriptionDetails obj={subscriptionData} />);
  it('should render two DynamicResourceLink with respective props', () => {
    const dynamicResourceLink = wrapper.find(DynamicResourceLink);
    expect(dynamicResourceLink).toHaveLength(2);
    expect(dynamicResourceLink.at(0).props().title).toEqual(`${i18nNS}~Channel`);
    expect(dynamicResourceLink.at(0).props().name).toEqual('testchannel');
    expect(dynamicResourceLink.at(1).props().title).toEqual(`${i18nNS}~Subscriber`);
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
