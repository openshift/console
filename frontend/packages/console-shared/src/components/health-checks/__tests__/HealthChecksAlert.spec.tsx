import * as React from 'react';
import { shallow } from 'enzyme';
import { Alert } from '@patternfly/react-core';
import * as utils from '@console/internal/components/utils';
import { sampleDeployments } from '@console/dev-console/src/components/topology/__tests__/topology-test-data';
import HealthChecksAlert from '../HealthChecksAlert';

describe('HealthChecksAlert', () => {
  const spyUseAccessReview = jest.spyOn(utils, 'useAccessReview');
  it('should show alert when health check probes not present', () => {
    spyUseAccessReview.mockReturnValue(true);
    const wrapper = shallow(<HealthChecksAlert resource={sampleDeployments.data[1]} />);
    expect(wrapper.find(Alert).exists()).toBe(true);
  });

  it('should not show alert when health check probes present', () => {
    spyUseAccessReview.mockReturnValue(true);
    const wrapper = shallow(<HealthChecksAlert resource={sampleDeployments.data[2]} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
  it('should not show alert when user has only view access', () => {
    spyUseAccessReview.mockReturnValue(false);
    const wrapper = shallow(<HealthChecksAlert resource={sampleDeployments.data[1]} />);
    expect(wrapper.find(Alert).exists()).toBe(false);
  });
});
