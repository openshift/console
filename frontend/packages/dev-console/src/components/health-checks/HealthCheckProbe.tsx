import type { FC } from 'react';
import { useContext, useState } from 'react';
import { Button, ButtonVariant, Tooltip } from '@patternfly/react-core';
import { MinusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/minus-circle-icon';
import { PlusCircleIcon } from '@patternfly/react-icons/dist/esm/icons/plus-circle-icon';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { GreenCheckCircleIcon } from '@console/shared';
import TertiaryHeading from '@console/shared/src/components/heading/TertiaryHeading';
import { getHealthChecksProbeConfig, healthChecksDefaultValues } from './health-checks-probe-utils';
import type { HealthCheckProbeData } from './health-checks-types';
import { HealthCheckContext } from './health-checks-utils';
import ProbeForm from './ProbeForm';
import './HealthCheckProbe.scss';

interface HealthCheckProbeProps {
  probeType: string;
}

const HealthCheckProbe: FC<HealthCheckProbeProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = useContext(HealthCheckContext);
  const [temporaryProbeData, setTemporaryProbeData] = useState<HealthCheckProbeData>();
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
            icon={
              <span className="odc-heath-check-probe__successText">
                <GreenCheckCircleIcon />{' '}
                {t('devconsole~{{healthCheckProbeAdded}} added', {
                  healthCheckProbeAdded: getHealthChecksProbeConfig(probeType, t).formTitle,
                })}
              </span>
            }
            className="odc-heath-check-probe__successButton"
            variant={ButtonVariant.plain}
            isInline
            onClick={showProbe}
          />
          {!viewOnly && (
            <Tooltip content={t('devconsole~Remove')} position="right">
              <Button
                icon={<MinusCircleIcon />}
                className="pf-m-plain--align-left"
                variant={ButtonVariant.plain}
                onClick={handleDeleteProbe}
              />
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
      <TertiaryHeading className="odc-heath-check-probe__formTitle">
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
      </TertiaryHeading>
      <div className="pf-v6-c-form__helper-text">
        {getHealthChecksProbeConfig(probeType, t).formSubtitle}
      </div>
      <div>{renderProbe()}</div>
    </>
  );
};

export default HealthCheckProbe;
