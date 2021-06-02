import * as React from 'react';
import { Button, ButtonVariant, Tooltip } from '@patternfly/react-core';
import { PlusCircleIcon, MinusCircleIcon } from '@patternfly/react-icons';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { GreenCheckCircleIcon } from '@console/shared';
import { getHealthChecksProbeConfig, healthChecksDefaultValues } from './health-checks-probe-utils';
import { HealthCheckProbeData } from './health-checks-types';
import { HealthCheckContext } from './health-checks-utils';
import ProbeForm from './ProbeForm';
import './HealthChecksProbe.scss';

interface HealthCheckProbeProps {
  probeType: string;
}

const HealthCheckProbe: React.FC<HealthCheckProbeProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const [temporaryProbeData, setTemporaryProbeData] = React.useState<HealthCheckProbeData>();
  const showProbe = () => {
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
          <Button
            className="odc-heath-check-probe__successButton"
            variant={ButtonVariant.plain}
            isInline
            onClick={showProbe}
          >
            <span className="odc-heath-check-probe__successText">
              <GreenCheckCircleIcon />{' '}
              {t('devconsole~{{healthCheckProbeAdded}} added', {
                healthCheckProbeAdded: getHealthChecksProbeConfig(probeType, t).formTitle,
              })}
            </span>
          </Button>
          {!viewOnly && (
            <Tooltip content={t('devconsole~Remove')} position="right">
              <Button
                className="pf-m-plain--align-left"
                variant={ButtonVariant.plain}
                onClick={handleDeleteProbe}
              >
                <MinusCircleIcon />
              </Button>
            </Tooltip>
          )}
        </>
      );
    }
    return viewOnly ? (
      t('devconsole~No {{noHealthCheckProbe}}', {
        noHealthCheckProbe: getHealthChecksProbeConfig(probeType, t).formTitle,
      })
    ) : (
      <Button
        className="pf-m-link--align-left"
        variant={ButtonVariant.link}
        onClick={handleAddProbe}
        icon={<PlusCircleIcon />}
      >
        {t('devconsole~Add {{addHealthCheckProbe}}', {
          addHealthCheckProbe: getHealthChecksProbeConfig(probeType, t).formTitle,
        })}
      </Button>
    );
  };

  return (
    <>
      <div className="co-section-heading-tertiary odc-heath-check-probe__formTitle">
        {getHealthChecksProbeConfig(probeType, t).formTitle}
        {healthChecks?.[probeType]?.enabled && (
          <Button
            className="pf-m-link--align-left"
            variant={ButtonVariant.link}
            onClick={showProbe}
          >
            &nbsp;&nbsp;
            {`${viewOnly ? t('devconsole~View') : t('devconsole~Edit')} ${t('devconsole~Probe')}`}
          </Button>
        )}
      </div>
      <div className="pf-c-form__helper-text">
        {getHealthChecksProbeConfig(probeType, t).formSubtitle}
      </div>
      <div className="co-toolbar__group co-toolbar__group--left">{renderProbe()}</div>
    </>
  );
};

export default HealthCheckProbe;
