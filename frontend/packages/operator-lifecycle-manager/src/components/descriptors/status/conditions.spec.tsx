import { mount } from 'enzyme';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { SectionHeading } from '@console/internal/components/utils';
import store from '@console/internal/redux';
import { testResourceInstance } from '../../../../mocks';
import { StatusCapability } from '../types';
import { DescriptorConditions } from './conditions';

describe('Conditions descriptor', () => {
  it('Renders a conditions table for conditions status descriptor', () => {
    const descriptor = {
      path: 'testConditions',
      displayName: 'Test Conditions',
      description: '',
      'x-descriptors': [StatusCapability.conditions],
    };
    const wrapper = mount(
      <DescriptorConditions descriptor={descriptor} obj={testResourceInstance} schema={{}} />,
      {
        wrappingComponent: (props) => (
          <BrowserRouter>
            <Provider store={store} {...props} />,
          </BrowserRouter>
        ),
      },
    );

    expect(wrapper.find(SectionHeading).text()).toEqual('Test Conditions');
    expect(wrapper.find('[data-test="condition[0].type"]').first().text()).toEqual('FooType');
    expect(wrapper.find('[data-test="condition[0].lastTransitionTime"]').first().text()).toEqual(
      'Oct 16, 2017, 12:00 PM',
    );
    expect(wrapper.find('[data-test="condition[0].message"]').first().text()).toEqual(
      'Foo message',
    );
    expect(wrapper.find('[data-test="condition[0].reason"]').first().text()).toEqual('FooReason');
    expect(wrapper.find('[data-test="condition[0].status"]').first().text()).toEqual('True');
    expect(wrapper.find('[data-test="condition[0].type"]').first().text()).toEqual('FooType');
    expect(wrapper.find('[data-test="condition[1].type"]').first().text()).toEqual('BarType');
    expect(wrapper.find('[data-test="condition[1].lastTransitionTime"]').first().text()).toEqual(
      'Oct 16, 2017, 12:01 PM',
    );
    expect(wrapper.find('[data-test="condition[1].message"]').first().text()).toEqual(
      'Bar message',
    );
    expect(wrapper.find('[data-test="condition[1].reason"]').first().text()).toEqual('BarReason');
    expect(wrapper.find('[data-test="condition[1].status"]').first().text()).toEqual('True');
    expect(wrapper.find('[data-test="condition[1].type"]').first().text()).toEqual('BarType');
  });
});
