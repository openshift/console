import * as React from 'react';
import { FormGroup, TextInputTypes } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField, getFieldId } from '@console/shared';

const SinkUri: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormGroup
      fieldId={getFieldId('sink-name', 'uri')}
      helperText={t(
        'knative-plugin~A Universal Resource Indicator where events are going to be delivered. Ex. "http://cluster.example.com/svc"',
      )}
      isRequired
    >
      <InputField
        type={TextInputTypes.text}
        name="formData.sink.uri"
        placeholder={t('knative-plugin~Enter URI')}
        data-test-id="sink-section-uri"
        required
      />
    </FormGroup>
  );
};

export default SinkUri;
