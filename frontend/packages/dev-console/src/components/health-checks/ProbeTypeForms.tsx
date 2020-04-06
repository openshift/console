import * as React from 'react';
import * as _ from 'lodash';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, CheckboxField, DropdownField, getFieldId } from '@console/shared';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';

interface ProbeTypeFormProps {
  ports?: object;
}

export const renderPortField = (ports: object, name: string, defaultValue: string) => {
  return _.isEmpty(ports) ? (
    <InputField type={TextInputTypes.text} name={name} label="Port" />
  ) : (
    <DropdownField
      name={name}
      label="Port"
      items={ports}
      title={ports[defaultValue] || 'Select target port'}
      fullWidth
    />
  );
};

export const HTTPProbeTypeForm: React.FC<ProbeTypeFormProps> = ({ ports }) => {
  const {
    values: {
      httpGet: { httpHeaders, port },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();
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
      setFieldValue('httpGet.httpHeaders', updatedNameValuePairs);
    },
    [setFieldValue],
  );

  return (
    <>
      <CheckboxField name="httpGet.scheme" label="Use HTTPS" value="HTTPS" />
      <FormGroup
        fieldId={getFieldId('httpGet.httpHeaders', 'nvp')}
        name="httpGet.httpHeaders"
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
      <InputField type={TextInputTypes.text} name="httpGet.path" label="Path" placeholder="/" />
      {renderPortField(ports, 'httpGet.port', port)}
    </>
  );
};

export const TCPProbeTypeForm: React.FC<ProbeTypeFormProps> = ({ ports }) => {
  const {
    values: {
      tcpSocket: { port },
    },
  } = useFormikContext<FormikValues>();
  return renderPortField(ports, 'tcpSocket.port', port);
};

export const CommandProbeTypeForm: React.FC = () => {
  return <InputField type={TextInputTypes.text} name="command" label="Command" />;
};
