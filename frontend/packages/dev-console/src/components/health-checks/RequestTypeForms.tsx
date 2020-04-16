import * as React from 'react';
import * as _ from 'lodash';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import {
  InputField,
  CheckboxField,
  DropdownField,
  getFieldId,
  TextColumnField,
} from '@console/shared';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';

interface RequestTypeFormProps {
  ports?: { [port: number]: number };
  probeType?: string;
}

export const renderPortField = (ports: object, name: string, defaultValue: string) => {
  return _.isEmpty(ports) ? (
    <InputField type={TextInputTypes.text} name={name} label="Port" required />
  ) : (
    <DropdownField
      name={name}
      label="Port"
      items={ports}
      title={ports[defaultValue] || 'Select target port'}
      fullWidth
      required
    />
  );
};

export const HTTPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ ports, probeType }) => {
  const {
    values: { healthChecks },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const httpHeaders = healthChecks?.[probeType]?.data?.httpGet?.httpHeaders;
  const port = healthChecks?.[probeType]?.data?.httpGet?.port;
  const initialNameValuePairs = !_.isEmpty(httpHeaders)
    ? httpHeaders.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialNameValuePairs);

  const handleNameValuePairs = React.useCallback(
    ({ nameValuePairs }) => {
      const updatedNameValuePairs = _.compact(
        nameValuePairs.map(([name, value]) => {
          if (_.isObject(value)) {
            return { name, valueFrom: value };
          }
          if (value.length) {
            return { name, value };
          }
          return null;
        }),
      );
      setNameValue(nameValuePairs);
      setFieldValue(`healthChecks.${probeType}.data.httpGet.httpHeaders`, updatedNameValuePairs);
    },
    [setFieldValue, probeType],
  );

  return (
    <>
      <CheckboxField
        name={`healthChecks.${probeType}.data.httpGet.scheme`}
        label="Use HTTPS"
        value="HTTPS"
      />
      <FormGroup
        fieldId={getFieldId(`healthChecks.${probeType}.data.httpGet.httpHeaders`, 'name-value')}
        name={`healthChecks.${probeType}.data.httpGet.httpHeaders`}
        label="HTTP Headers"
      >
        <NameValueEditor
          nameValuePairs={nameValue}
          valueString="Value"
          nameString="Header Name"
          addString="Add Header"
          readOnly={false}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
      <InputField
        type={TextInputTypes.text}
        name={`healthChecks.${probeType}.data.httpGet.path`}
        label="Path"
        placeholder="/"
      />
      {renderPortField(ports, `healthChecks.${probeType}.data.httpGet.port`, port)}
    </>
  );
};

export const TCPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ ports, probeType }) => {
  const {
    values: { healthChecks },
  } = useFormikContext<FormikValues>();
  const port = healthChecks?.[probeType]?.data?.tcpSocket?.port;
  return renderPortField(ports, `healthChecks.${probeType}.data.tcpSocket.port`, port);
};

export const CommandRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  return (
    <TextColumnField
      name={`healthChecks.${probeType}.data.exec.command`}
      label="Command"
      addLabel="Add command"
      placeholder="argument"
      helpText={'The command to run inside the container.'}
      required
    />
  );
};
