import * as React from 'react';
import FormSection from '../import/section/FormSection';
import HealthCheckProbe from './HealthCheckProbe';
import { HealthChecksProbeType } from './health-checks-types';

interface HealthChecksProps {
  title?: string;
}

const HealthChecks: React.FC<HealthChecksProps> = ({ title }) => (
  <FormSection title={title}>
    <HealthCheckProbe probeType={HealthChecksProbeType.ReadinessProbe} />

    <HealthCheckProbe probeType={HealthChecksProbeType.LivenessProbe} />

    <HealthCheckProbe probeType={HealthChecksProbeType.StartupProbe} />
  </FormSection>
);

export default HealthChecks;
