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
import { Resources } from '@console/dev-console/src/components/import/import-types';

interface RequestTypeFormProps {
  ports?: { [port: number]: number };
  probeType?: string;
}

export const renderPortField = (
  ports: { [port: number]: number },
  fieldName: string,
  defaultPort: number,
  resourceType: Resources,
) => {
  if (resourceType === Resources.KnativeService) {
    return (
      <InputField
        type={TextInputTypes.text}
        name="knative-port"
        label="Port"
        placeholder="0"
        isDisabled
      />
    );
  }
  return _.isEmpty(ports) ? (
    <InputField type={TextInputTypes.text} name={fieldName} label="Port" required />
  ) : (
    <DropdownField
      name={fieldName}
      label="Port"
      items={ports}
      title={ports[defaultPort] || 'Select target port'}
      fullWidth
      required
    />
  );
};

export const HTTPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ ports, probeType }) => {
  const {
    values: { healthChecks, resources },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const httpHeaders = healthChecks?.[probeType]?.data?.httpGet?.httpHeaders;
  const defaultPort = healthChecks?.[probeType]?.data?.httpGet?.port;
  const initialNameValuePairs = !_.isEmpty(httpHeaders)
    ? httpHeaders.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = React.useState(initialNameValuePairs);
  const portFieldName = `healthChecks.${probeType}.data.httpGet.port`;

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
      {renderPortField(ports, portFieldName, defaultPort, resources)}
    </>
  );
};

export const TCPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ ports, probeType }) => {
  const {
    values: { healthChecks, resources },
  } = useFormikContext<FormikValues>();
  const defaultPort = healthChecks?.[probeType]?.data?.tcpSocket?.port;
  const portFieldName = `healthChecks.${probeType}.data.tcpSocket.port`;
  return renderPortField(ports, portFieldName, defaultPort, resources);
};

export const CommandRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  return (
    <TextColumnField
      name={`healthChecks.${probeType}.data.exec.command`}
      label="Command"
      addLabel="Add command"
      placeholder="argument"
      helpText="The command to run inside the container."
      required
    />
  );
};
