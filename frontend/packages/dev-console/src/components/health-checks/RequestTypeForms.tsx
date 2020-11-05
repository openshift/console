import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import { InputField, CheckboxField, getFieldId, TextColumnField } from '@console/shared';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { Resources } from '../import/import-types';
import { HealthCheckContext } from './health-checks-utils';

interface RequestTypeFormProps {
  probeType?: string;
}

interface RenderPortFieldProps {
  fieldName: string;
  resourceType: Resources;
  viewOnly: boolean;
}

export const RenderPortField: React.FC<RenderPortFieldProps> = ({
  fieldName,
  resourceType,
  viewOnly,
}) => {
  const { t } = useTranslation();
  return resourceType === Resources.KnativeService ? (
    <InputField
      type={TextInputTypes.text}
      name="knative-port"
      label={t('devconsole~Port')}
      placeholder="0"
      isDisabled
    />
  ) : (
    <InputField
      type={TextInputTypes.text}
      name={fieldName}
      label={t('devconsole~Port')}
      isDisabled={viewOnly}
      required
    />
  );
};

export const HTTPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks, resources },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const httpHeaders = healthChecks?.[probeType]?.data?.httpGet?.httpHeaders;
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
        label={t('devconsole~Use HTTPS')}
        value="HTTPS"
        isDisabled={viewOnly}
      />
      <FormGroup
        fieldId={getFieldId(`healthChecks.${probeType}.data.httpGet.httpHeaders`, 'name-value')}
        name={`healthChecks.${probeType}.data.httpGet.httpHeaders`}
        label={t('devconsole~HTTP Headers')}
      >
        <NameValueEditor
          nameValuePairs={nameValue}
          valueString={t('devconsole~Value')}
          nameString={t('devconsole~Header Name')}
          addString={t('devconsole~Add Header')}
          readOnly={viewOnly}
          allowSorting={false}
          updateParentData={handleNameValuePairs}
        />
      </FormGroup>
      <InputField
        type={TextInputTypes.text}
        name={`healthChecks.${probeType}.data.httpGet.path`}
        label={t('devconsole~Path')}
        placeholder="/"
        isDisabled={viewOnly}
      />
      <RenderPortField fieldName={portFieldName} resourceType={resources} viewOnly={viewOnly} />
    </>
  );
};

export const TCPRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const {
    values: { resources },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const portFieldName = `healthChecks.${probeType}.data.tcpSocket.port`;
  return <RenderPortField fieldName={portFieldName} resourceType={resources} viewOnly={viewOnly} />;
};

export const CommandRequestTypeForm: React.FC<RequestTypeFormProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = React.useContext(HealthCheckContext);
  const commands = healthChecks?.[probeType]?.data?.exec?.command || [''];
  return (
    <TextColumnField
      name={`healthChecks.${probeType}.data.exec.command`}
      label={t('devconsole~Command')}
      addLabel={t('devconsole~Add command')}
      placeholder={t('devconsole~argument')}
      helpText={t('devconsole~The command to run inside the container.')}
      required
      disableDeleteRow={commands.length === 1}
      isReadOnly={viewOnly}
    />
  );
};
