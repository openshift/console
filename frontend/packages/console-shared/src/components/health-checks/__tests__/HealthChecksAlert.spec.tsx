import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from '@patternfly/react-core';
import { sampleDeployments } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import HealthChecksAlert from '../HealthChecksAlert';

describe('HealthChecksAlert', () => {
  it('should show alert when health check probes not present', () => {
    const wrapper = shallow(<HealthChecksAlert resource={sampleDeployments.data[1]} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should not show alert when health check probes present', () => {
    const wrapper = shallow(<HealthChecksAlert resource={sampleDeployments.data[2]} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
});
