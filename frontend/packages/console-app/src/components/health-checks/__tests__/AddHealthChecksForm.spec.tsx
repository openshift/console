import * as React from 'react';
import AddHealthChecksForm from '../AddHealthChecksForm';
import { shallow } from 'enzyme';
import { LoadingBox, StatusBox } from '@console/internal/components/utils';
import { sampleDeployments } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import { Formik } from 'formik';

let addHealthCheckWrapperProps: React.ComponentProps<typeof AddHealthChecksForm>;

describe('HealthCheckWrapper', () => {
  beforeEach(() => {
    addHealthCheckWrapperProps = {
      currentContainer: '',
      resource: {
        loaded: false,
        data: sampleDeployments.data[0],
        loadError: '',
      },
    };
  });

  it('should show LoadingBox when data is not loaded', () => {
    const wrapper = shallow(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);
    expect(wrapper.find(LoadingBox).exists()).toBe(true);
  });

  it('should show StatusBox on load error', () => {
    addHealthCheckWrapperProps.resource.loaded = true;
    addHealthCheckWrapperProps.resource.loadError = `Not Found`;
    const wrapper = shallow(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);
    expect(wrapper.find(StatusBox).exists()).toBe(true);
  });

  it('should show container not found error', () => {
    addHealthCheckWrapperProps.resource.loaded = true;
    const wrapper = shallow(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);
    expect(wrapper.find('div').text()).toEqual('Container not found');
  });

  it('should load AddHealthCheck', () => {
    addHealthCheckWrapperProps = {
      currentContainer: 'wit-deployment',
      resource: {
        loaded: true,
        data: sampleDeployments.data[1],
        loadError: '',
      },
    };
    const wrapper = shallow(<AddHealthChecksForm {...addHealthCheckWrapperProps} />);
    expect(wrapper.find(Formik).exists()).toBe(true);
  });
});
