import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import { Formik } from 'formik';
import { Button } from '@patternfly/react-core';

import { Dropdown } from '../../../public/components/utils';
import {
  CreateRoute,
  CreateRouteState,
  AlternateServicesGroup,
} from '../../../public/components/routes/create-route';
import * as UIActions from '../../../public/actions/ui';

describe('Create Route', () => {
  let wrapper: ShallowWrapper<{}, CreateRouteState>;

  beforeEach(() => {
    spyOn(UIActions, 'getActiveNamespace').and.returnValue('default');
    const services = [
      { metadata: { name: 'service1' } },
      { metadata: { name: 'service2' } },
      { metadata: { name: 'service3' } },
      { metadata: { name: 'service4' } },
    ];
    wrapper = shallow(
      <Formik initialValues={{}} onSubmit={jest.fn()}>
        <CreateRoute services={services} />
      </Formik>,
    )
      .dive()
      .dive()
      .dive()
      .dive()
      .dive();
  });

  it('should render CreateRoute component', () => {
    expect(wrapper.exists()).toBe(true);
  });

  it('should render the form elements of CreateRoute component', () => {
    expect(wrapper.find('input[id="name"]').exists()).toBe(true);
    expect(wrapper.find('input[id="hostname"]').exists()).toBe(true);
    expect(wrapper.find('input[id="path"]').exists()).toBe(true);
    expect(wrapper.find(Dropdown).exists()).toBe(true);
    expect(wrapper.find('input[id="secure"]').exists()).toBe(true);
  });

  it('should display the Add alternate Service link when a service is selected', () => {
    expect(wrapper.contains('Add alternate Service')).not.toBeTruthy();

    wrapper.setState({
      service: {
        metadata: {
          name: 'service1',
        },
      },
      weight: 100,
    });
    expect(wrapper.contains('Add alternate Service')).toBeTruthy();
  });

  it('should display/remove the Add/Remove and Alt Services Group based on alternate services', () => {
    expect(wrapper.contains('Add alternate Service')).not.toBeTruthy();
    expect(wrapper.contains('Remove alternate Service')).not.toBeTruthy();
    expect(wrapper.find('input[id="weight"]').exists()).toBe(false);

    wrapper.setState({
      service: {
        metadata: {
          name: 'service1',
        },
      },
      weight: 100,
      alternateServices: [
        {
          key: 'alternate-backend-2',
          name: 'service2',
          weight: 100,
        },
      ],
    });

    expect(wrapper.contains('Remove alternate Service')).toBeTruthy();
    expect(wrapper.contains('Add alternate Service')).toBeTruthy();
    expect(wrapper.find('input[id="weight"]').exists()).toBe(true);
    expect(wrapper.find(AlternateServicesGroup).exists()).toBe(true);
  });

  it('should remove the Add/Remove and Alt Services Group after clicking remove', () => {
    expect(wrapper.find(AlternateServicesGroup).exists()).toBe(false);

    wrapper.setState({
      service: {
        metadata: {
          name: 'service1',
        },
      },
      weight: 100,
      alternateServices: [
        {
          key: 'alternate-backend-2',
          name: 'service2',
          weight: 100,
        },
      ],
    });

    expect(wrapper.find(AlternateServicesGroup).exists()).toBe(true);
    expect(wrapper.contains('Remove alternate Service')).toBeTruthy();
    wrapper.find(Button).at(0).simulate('click');
    expect(wrapper.find(AlternateServicesGroup).exists()).toBe(false);
    expect(wrapper.contains('Remove alternate Service')).not.toBeTruthy();
  });

  it('should only allow 3 alt services', () => {
    expect(wrapper.find(AlternateServicesGroup).length).toEqual(0);

    wrapper.setState({
      service: {
        metadata: {
          name: 'service1',
        },
      },
      weight: 100,
      alternateServices: [
        {
          key: 'alternate-backend-2',
          name: 'service2',
          weight: 100,
        },
        {
          key: 'alternate-backend-3',
          name: 'service2',
          weight: 100,
        },
        {
          key: 'alternate-backend-4',
          name: 'service2',
          weight: 100,
        },
      ],
    });

    expect(wrapper.find(AlternateServicesGroup).length).toEqual(3);
    expect(wrapper.contains('Add alternate Service')).not.toBeTruthy();
  });
});
