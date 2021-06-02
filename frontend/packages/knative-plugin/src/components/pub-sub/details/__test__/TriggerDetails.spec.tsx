import * as React from 'react';
import { shallow } from 'enzyme';
import * as _ from 'lodash';
import { Conditions } from '@console/internal/components/conditions';
import { triggerData } from '../../../../utils/__tests__/knative-eventing-data';
import FilterTable from '../../../overview/FilterTable';
import DynamicResourceLink from '../DynamicResourceLink';
import TriggerDetails from '../TriggerDetails';

jest.mock('react-i18next', () => {
  const reactI18next = require.requireActual('react-i18next');
  return {
    ...reactI18next,
    useTranslation: () => ({ t: (key) => key }),
  };
});

const i18nNS = 'knative-plugin';

describe('SubscriptionDetails', () => {
  const wrapper = shallow(<TriggerDetails obj={triggerData} />);
  it('should render two DynamicResourceLink with respective props', () => {
    const dynamicResourceLink = wrapper.find(DynamicResourceLink);
    expect(dynamicResourceLink).toHaveLength(2);
    expect(dynamicResourceLink.at(0).props().title).toEqual(`${i18nNS}~Broker`);
    expect(dynamicResourceLink.at(0).props().name).toEqual('default');
    expect(dynamicResourceLink.at(1).props().title).toEqual(`${i18nNS}~Subscriber`);
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
