import type { FC } from 'react';
import { useContext, useState, useCallback } from 'react';
import { TextInputTypes, FormGroup } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { NameValueEditor } from '@console/internal/components/utils/name-value-editor';
import { InputField, CheckboxField, getFieldId, TextColumnField } from '@console/shared';
import { Resources } from '../import/import-types';
import { HealthCheckContext } from './health-checks-utils';

interface RequestTypeFormProps {
  probeType?: string;
}

export const renderPortField = (
  fieldName: string,
  resourceType: Resources,
  viewOnly: boolean,
  t: TFunction,
) => {
  if (resourceType === Resources.KnativeService) {
    return (
      <InputField
        type={TextInputTypes.text}
        name="knative-port"
        label={t('devconsole~Port')}
        placeholder="0"
        isDisabled
      />
    );
  }
  return (
    <InputField
      type={TextInputTypes.text}
      name={fieldName}
      label={t('devconsole~Port')}
      isDisabled={viewOnly}
      required
    />
  );
};

export const HTTPRequestTypeForm: FC<RequestTypeFormProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks, resources },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const { viewOnly } = useContext(HealthCheckContext);
  const httpHeaders = healthChecks?.[probeType]?.data?.httpGet?.httpHeaders;
  const initialNameValuePairs = !_.isEmpty(httpHeaders)
    ? httpHeaders.map((val) => _.values(val))
    : [['', '']];
  const [nameValue, setNameValue] = useState(initialNameValuePairs);
  const portFieldName = `healthChecks.${probeType}.data.httpGet.port`;

  const handleNameValuePairs = useCallback(
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
          nameString={t('devconsole~Header name')}
          addString={t('devconsole~Add header')}
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
      {renderPortField(portFieldName, resources, viewOnly, t)}
    </>
  );
};

export const TCPRequestTypeForm: FC<RequestTypeFormProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { resources },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = useContext(HealthCheckContext);
  const portFieldName = `healthChecks.${probeType}.data.tcpSocket.port`;
  return renderPortField(portFieldName, resources, viewOnly, t);
};

export const CommandRequestTypeForm: FC<RequestTypeFormProps> = ({ probeType }) => {
  const { t } = useTranslation();
  const {
    values: { healthChecks },
  } = useFormikContext<FormikValues>();
  const { viewOnly } = useContext(HealthCheckContext);
  const commands = healthChecks?.[probeType]?.data?.exec?.command || [''];
  return (
    <TextColumnField
      name={`healthChecks.${probeType}.data.exec.command`}
      label={t('devconsole~Command')}
      addLabel={t('devconsole~Add command')}
      placeholder={t('devconsole~argument')}
      helpText={t('devconsole~The command to run inside the Container.')}
      required
      disableDeleteRow={commands.length === 1}
      isReadOnly={viewOnly}
    />
  );
};
