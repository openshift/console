import type { FC } from 'react';
import { useContext } from 'react';
import { TextInputTypes, InputGroupText } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ActionGroupWithIcons } from '@console/shared/src/components/form-utils/ActionGroupWithIcons';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { InputGroupField } from '@console/shared/src/components/formik-fields/InputGroupField';
import FormSection from '../import/section/FormSection';
import { RequestType } from './health-checks-types';
import { HealthCheckContext } from './health-checks-utils';
import {
  HTTPRequestTypeForm,
  TCPRequestTypeForm,
  CommandRequestTypeForm,
} from './RequestTypeForms';
import './ProbeForm.scss';

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

const ProbeForm: FC<ProbeFormProps> = ({ onSubmit, onClose, probeType }) => {
  const { t } = useTranslation('devconsole');
  const {
    values: { healthChecks },
    errors,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = useContext(HealthCheckContext);
  const RequestTypeOptions = {
    httpGet: t('HTTP GET'),
    command: t('Container command'),
    tcpSocket: t('TCP socket'),
  };
  return (
    <div className="odc-heath-check-probe-form">
      <FormSection>
        <DropdownField
          name={`healthChecks.${probeType}.data.requestType`}
          label={t('Type')}
          items={RequestTypeOptions}
          title={RequestType.HTTPGET}
          disabled={viewOnly}
          fullWidth
        />
        {getRequestTypeForm(healthChecks?.[probeType]?.data?.requestType, probeType)}
        <InputField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.failureThreshold`}
          label={t('Failure threshold')}
          style={{ maxWidth: '100%' }}
          helpText={t(
            'devconsole~How many times the probe will try starting or restarting before giving up.',
          )}
          isDisabled={viewOnly}
        />
        <InputField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.successThreshold`}
          label={t('Success threshold')}
          style={{ maxWidth: '100%' }}
          helpText={t(
            'devconsole~How many consecutive successes for the probe to be considered successful after having failed.',
          )}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.initialDelaySeconds`}
          label={t('Initial delay')}
          helpText={t(
            'devconsole~How long to wait after the Container starts before checking its health.',
          )}
          afterInput={<InputGroupText>{t('seconds')}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.periodSeconds`}
          label={t('Period')}
          helpText={t('How often to perform the probe.')}
          afterInput={<InputGroupText>{t('seconds')}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.text}
          name={`healthChecks.${probeType}.data.timeoutSeconds`}
          label={t('Timeout')}
          helpText={t(
            'devconsole~How long to wait for the probe to finish, if the time is exceeded, the probe is considered failed.',
          )}
          afterInput={<InputGroupText>{t('seconds')}</InputGroupText>}
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
