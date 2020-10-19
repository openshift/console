import * as React from 'react';
import * as _ from 'lodash';
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

enum RequestTypeOptions {
  httpGet = 'HTTP GET',
  command = 'Container Command',
  tcpSocket = 'TCP Socket',
}

const ProbeForm: React.FC<ProbeFormProps> = ({ onSubmit, onClose, probeType }) => {
  const {
    values: { healthChecks },
    errors,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  return (
    <div className="odc-heath-check-probe-form">
      <FormSection>
        <DropdownField
          name={`healthChecks.${probeType}.data.requestType`}
          label="Type"
          items={RequestTypeOptions}
          title={RequestType.HTTPGET}
          disabled={viewOnly}
          fullWidth
        />
        {getRequestTypeForm(healthChecks?.[probeType]?.data?.requestType, probeType)}
        <InputField
          type={TextInputTypes.number}
          name={`healthChecks.${probeType}.data.failureThreshold`}
          label="Failure Threshold"
          style={{ maxWidth: '100%' }}
          helpText="How many times the probe will try starting or restarting before giving up."
          isDisabled={viewOnly}
        />
        <InputField
          type={TextInputTypes.number}
          name={`healthChecks.${probeType}.data.successThreshold`}
          label="Success Threshold"
          style={{ maxWidth: '100%' }}
          helpText="How many consecutive successes for the probe to be considered successful after having failed."
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.number}
          name={`healthChecks.${probeType}.data.initialDelaySeconds`}
          label="Initial Delay"
          helpText="How long to wait after the container starts before checking it's health."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.number}
          name={`healthChecks.${probeType}.data.periodSeconds`}
          label="Period"
          helpText="How often to perform the probe."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          isDisabled={viewOnly}
        />
        <InputGroupField
          type={TextInputTypes.number}
          name={`healthChecks.${probeType}.data.timeoutSeconds`}
          label="Timeout"
          helpText="How long to wait for the probe to finish, if the time is exceeded, the probe is considered failed."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
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
