import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, InputGroupText } from '@patternfly/react-core';
import { InputGroupField, InputField, DropdownField, ActionGroupWithIcons } from '@console/shared';
import {
  HTTPRequestTypeForm,
  TCPRequestTypeForm,
  CommandRequestTypeForm,
} from './RequestTypeForms';
import { RequestType } from './health-checks-types';
import FormSection from '../import/section/FormSection';
import './ProbeForm.scss';
import { HealthCheckContext } from './health-checks-utils';

const getRequestTypeForm = (value: string, probeType: string) => {
  switch (value) {
    case RequestType.HTTPGET:
      return <HTTPRequestTypeForm probeType={probeType} />;
    case RequestType.ContainerCommand:
      return <CommandRequestTypeForm probeType={probeType} />;
    case RequestType.TCPSocket:
      return <TCPRequestTypeForm probeType={probeType} />;
    default:
      return null;
  }
};

interface ProbeFormProps {
  onSubmit: () => void;
  onClose: () => void;
  probeType: string;
}

const ProbeForm: React.FC<ProbeFormProps> = ({ onSubmit, onClose, probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks },
    errors,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const RequestTypeOptions = {
    httpGet: t('devconsole~HTTP GET'),
    command: t('devconsole~Container command'),
    tcpSocket: t('devconsole~TCP socket'),
  };
  return (
    <div className="odc-heath-check-probe-form">
      <FormSection>
        <DropdownField
          name={`healthChecks.${probeType}.data.requestType`}
          label={t('devconsole~Type')}
          items={RequestTypeOptions}
          title={RequestType.HTTPGET}
          disabled={viewOnly}
          fullWidth
        />
        {getRequestTypeForm(healthChecks?.[probeType]?.data?.requestType, probeType)}
        <InputField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.failureThreshold`}
          label={t('devconsole~Failure threshold')}
          style={{ maxWidth: '100%' }}
          helpText={t(
            'devconsole~How many times the probe will try starting or restarting before giving up.',
          )}
          isDisabled={viewOnly}
        />
        <InputField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.successThreshold`}
          label={t('devconsole~Success threshold')}
          style={{ maxWidth: '100%' }}
          helpText={t(
            'devconsole~How many consecutive successes for the probe to be considered successful after having failed.',
          )}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.initialDelaySeconds`}
          label={t('devconsole~Initial delay')}
          helpText={t(
            "devconsole~How long to wait after the Container starts before checking it's health.",
          )}
          afterInput={<InputGroupText>{t('devconsole~seconds')}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.periodSeconds`}
          label={t('devconsole~Period')}
          helpText={t('devconsole~How often to perform the probe.')}
          afterInput={<InputGroupText>{t('devconsole~seconds')}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.timeoutSeconds`}
          label={t('devconsole~Timeout')}
          helpText={t(
            'devconsole~How long to wait for the probe to finish, if the time is exceeded, the probe is considered failed.',
          )}
          afterInput={<InputGroupText>{t('devconsole~seconds')}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
      </FormSection>
      <ActionGroupWithIcons
        onSubmit={!viewOnly ? onSubmit : undefined}
        onClose={onClose}
        isDisabled={!_.isEmpty(errors?.healthChecks?.[probeType])}
      />
    </div>
  );
};

export default ProbeForm;
