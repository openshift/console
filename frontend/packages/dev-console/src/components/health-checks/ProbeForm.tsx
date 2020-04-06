import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, InputGroupText } from '@patternfly/react-core';
import { InputGroupField, InputField, DropdownField, FormFooter } from '@console/shared';
import { FormFooterVariant } from '@console/shared/src/components/form-utils/form-utils-types';
import { HTTPProbeTypeForm, TCPProbeTypeForm, CommandProbeTypeForm } from './ProbeTypeForms';
import { ProbeType } from './health-checks-types';
import FormSection from '../import/section/FormSection';
import './ProbeForm.scss';

const getProbeTypeForm = (value: string, ports: object) => {
  switch (value) {
    case ProbeType.HTTPGET:
      return <HTTPProbeTypeForm ports={ports} />;
    case ProbeType.ContainerCommand:
      return <CommandProbeTypeForm />;
    case ProbeType.TCPSocket:
      return <TCPProbeTypeForm ports={ports} />;
    default:
      return undefined;
  }
};

interface ProbeFormProps {
  containerPorts?: object;
}

enum probeTypeOptions {
  'httpGet' = 'HTTP GET',
  'containerCommand' = 'Container Command',
  'tcpSocket' = 'TCP Socket',
}

const ProbeForm: React.FC<FormikProps<FormikValues> & ProbeFormProps> = ({
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  errors,
  containerPorts,
}) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const onProbeTypeChange = (value) => {
    setFieldValue('probeType', value);
  };
  return (
    <div className="odc-heath-check__probe-form">
      <FormSection>
        <InputField
          type={TextInputTypes.number}
          name="failureThreshold"
          label="Failure Threshold"
          style={{ maxWidth: '100%' }}
          helpText={'How many times the probe will try starting or restarting before giving up.'}
        />
        <DropdownField
          name="probeType"
          label="Type"
          items={probeTypeOptions}
          title={ProbeType.HTTPGET}
          onChange={onProbeTypeChange}
          fullWidth
        />
        {getProbeTypeForm(values.probeType, containerPorts)}
        <InputGroupField
          type={TextInputTypes.number}
          name="initialDelaySeconds"
          label="Initial Delay"
          helpText="How long to wait before the container starts before checking it's health."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          required
        />
        <InputGroupField
          type={TextInputTypes.number}
          name="periodSeconds"
          label="Period"
          helpText="How often to perform the probe."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
          style={{ maxWidth: '100%' }}
          required
        />
        <InputGroupField
          type={TextInputTypes.number}
          name="timeoutSeconds"
          label="Timeout"
          helpText="How long to wait for the probe to finish, if the time is exceeded, the probe is considered failed."
          afterInput={<InputGroupText>{'seconds'}</InputGroupText>}
          style={{ maxWidth: '100%' }}
        />
        <InputField
          type={TextInputTypes.number}
          name="successThreshold"
          label="Success Threshold"
          style={{ maxWidth: '100%' }}
          helpText={
            'How many consecutive successes for the probe to be considered successful after having failed.'
          }
        />
      </FormSection>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        disableSubmit={!_.isEmpty(errors)}
        handleSubmit={handleSubmit}
        formFooterVariant={FormFooterVariant.Icons}
      />
    </div>
  );
};

export default ProbeForm;
