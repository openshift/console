import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { GreenCheckCircleIcon } from '@console/shared';
import { Button, ButtonVariant } from '@patternfly/react-core';
import ProbeForm from './ProbeForm';
import { getHealthChecksProbeConfig, healthChecksDefaultValues } from './health-checks-probe-utils';
import { HealthCheckProbeData } from './health-checks-types';
import './HealthChecksProbe.scss';

interface HealthCheckProbeProps {
  probeType: string;
}

const HealthCheckProbe: React.FC<HealthCheckProbeProps> = ({ probeType }) => {
  const {
    values: { healthChecks },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const [temporaryProbeData, setTemporaryProbeData] = React.useState<HealthCheckProbeData>();
  const onEditProbe = () => {
    setFieldValue(`healthChecks.${probeType}.showForm`, true);
    setTemporaryProbeData(healthChecks?.[probeType].data);
  };

  const handleDeleteProbe = () => {
    setFieldValue(`healthChecks.${probeType}`, healthChecksDefaultValues);
    if (healthChecks?.[probeType]?.modified) {
      setFieldValue(`healthChecks.${probeType}.modified`, false);
    } else {
      setFieldValue(`healthChecks.${probeType}.modified`, true);
    }
  };

  const handleReset = () => {
    if (!healthChecks?.[probeType]?.enabled) {
      setFieldValue(`healthChecks.${probeType}`, healthChecksDefaultValues);
    } else {
      setFieldValue(`healthChecks.${probeType}.showForm`, false);
      setFieldValue(`healthChecks.${probeType}.data`, temporaryProbeData);
    }
    setFieldValue(`healthChecks.${probeType}.modified`, false);
  };

  const handleSubmit = () => {
    setFieldValue(`healthChecks.${probeType}.showForm`, false);
    setFieldValue(`healthChecks.${probeType}.enabled`, true);
    setFieldValue(`healthChecks.${probeType}.modified`, true);
  };

  const handleAddProbe = () => {
    setFieldValue(`healthChecks.${probeType}.showForm`, true);
  };

  const renderProbe = () => {
    if (healthChecks?.[probeType]?.showForm) {
      return <ProbeForm onSubmit={handleSubmit} onClose={handleReset} probeType={probeType} />;
    }
    if (healthChecks?.[probeType]?.enabled) {
      return (
        <>
          <span className="odc-heath-check-probe__successText">
            <GreenCheckCircleIcon /> {`${getHealthChecksProbeConfig(probeType).formTitle} Added`}
          </span>
          <Button
            className="pf-m-plain--align-left"
            variant={ButtonVariant.plain}
            onClick={handleDeleteProbe}
          >
            <MinusCircleIcon />
          </Button>
        </>
      );
    }
    return (
      <Button
        className="pf-m-link--align-left"
        variant={ButtonVariant.link}
        onClick={handleAddProbe}
        icon={<PlusCircleIcon />}
      >
        {`Add ${getHealthChecksProbeConfig(probeType).formTitle}`}
      </Button>
    );
  };

  return (
    <>
      <div className="co-section-heading-tertiary odc-heath-check-probe__formTitle">
        {getHealthChecksProbeConfig(probeType).formTitle}
        {healthChecks?.[probeType]?.enabled && (
          <Button
            className="pf-m-link--align-left"
            variant={ButtonVariant.link}
            onClick={onEditProbe}
          >
            &nbsp;&nbsp;
            {'Edit Probe'}
          </Button>
        )}
      </div>
      <div className="pf-c-form__helper-text">
        {getHealthChecksProbeConfig(probeType).formSubtitle}
      </div>
      <div className="co-toolbar__group co-toolbar__group--left">{renderProbe()}</div>
    </>
  );
};

export default HealthCheckProbe;
