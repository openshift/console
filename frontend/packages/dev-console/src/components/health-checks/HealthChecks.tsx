import * as React from 'react';
import { PageHeading } from '@console/internal/components/utils';
import FormSection from '../import/section/FormSection';
import HealthCheckProbe from './HealthCheckProbe';
import { HealthChecksProbeType } from './health-checks-types';
import { getHealthChecksProbeData } from './health-checks-utils';

interface HealthChecksProps {
  pageTitle?: string;
}

const renderProbes = () => {
  return (
    <>
      <HealthCheckProbe
        probe={HealthChecksProbeType.ReadinessProbe}
        initialValues={getHealthChecksProbeData(HealthChecksProbeType.ReadinessProbe)}
      />

      <HealthCheckProbe
        probe={HealthChecksProbeType.LivenessProbe}
        initialValues={getHealthChecksProbeData(HealthChecksProbeType.LivenessProbe)}
      />

      <HealthCheckProbe
        probe={HealthChecksProbeType.StartupProbe}
        initialValues={getHealthChecksProbeData(HealthChecksProbeType.StartupProbe)}
      />
    </>
  );
};

const HealthChecks: React.FC<HealthChecksProps> = ({ pageTitle }) => {
  return pageTitle ? (
    <>
      <PageHeading title={pageTitle} />
      {renderProbes()}
    </>
  ) : (
    <FormSection title="Health Checks">{renderProbes()}</FormSection>
  );
};

export default HealthChecks;
