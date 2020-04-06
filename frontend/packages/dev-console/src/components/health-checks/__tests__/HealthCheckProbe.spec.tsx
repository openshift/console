import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import HealthCheckProbe from '../HealthCheckProbe';
import { HealthChecksProbeType, ProbeType } from '../health-checks-types';
import { Formik } from 'formik';
import { Button } from '@patternfly/react-core';

type HealthCheckProbeProps = React.ComponentProps<typeof HealthCheckProbe>;
let healthCheckProbe: ShallowWrapper<HealthCheckProbeProps>;

describe('HealthCheckProbe', () => {
  let healthCheckProbeProps;
  beforeEach(() => {
    healthCheckProbeProps = {
      probe: HealthChecksProbeType.ReadinessProbe,
      initialValues: {
        failureThreshold: 1,
        probeType: ProbeType.HTTPGET,
        httpGet: {
          scheme: 'HTTP',
          path: '/',
          port: '8080',
          httpHeaders: {},
        },
        tcpSocket: {
          port: '8080',
        },
        command: '',
        initialDelaySeconds: 1,
        periodSeconds: 1,
        timeoutSeconds: 1,
        successThreshold: 1,
      },
    };

    healthCheckProbe = shallow(<HealthCheckProbe {...healthCheckProbeProps} />);
  });
  it('should Readiness probe Formik Form Component', () => {
    expect(healthCheckProbe.find(Button).props().children).toBe('Add Readiness Probe');
    healthCheckProbe.find(Button).simulate('click');
    expect(healthCheckProbe.find(Formik).exists()).toBe(true);
  });
});
