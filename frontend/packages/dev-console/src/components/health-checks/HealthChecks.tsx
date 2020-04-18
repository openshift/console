import * as React from 'react';
import FormSection from '../import/section/FormSection';
import HealthCheckProbe from './HealthCheckProbe';
import { HealthChecksProbeType } from './health-checks-types';
import { Resources } from '../import/import-types';

interface HealthChecksProps {
  title?: string;
  resourceType: Resources;
}

const HealthChecks: React.FC<HealthChecksProps> = ({ title, resourceType }) => (
  <FormSection title={title}>
    <HealthCheckProbe probeType={HealthChecksProbeType.ReadinessProbe} />

    <HealthCheckProbe probeType={HealthChecksProbeType.LivenessProbe} />

    {resourceType !== Resources.KnativeService && (
      <HealthCheckProbe probeType={HealthChecksProbeType.StartupProbe} />
    )}
  </FormSection>
);

export default HealthChecks;
