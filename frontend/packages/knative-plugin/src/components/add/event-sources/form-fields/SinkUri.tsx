import * as React from 'react';
import {
  FormGroup,
  FormHelperText,
  HelperText,
  HelperTextItem,
  TextInputTypes,
} from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { InputField, getFieldId } from '@console/shared';

const SinkUri: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FormGroup fieldId={getFieldId('sink-name', 'uri')} isRequired>
      <InputField
        type={TextInputTypes.text}
        name="formData.sink.uri"
        placeholder={t('knative-plugin~Enter URI')}
        data-test-id="sink-section-uri"
        required
      />

      <FormHelperText>
        <HelperText>
          <HelperTextItem>
            {t(
              'knative-plugin~A Universal Resource Indicator where events are going to be delivered. Ex. "http://cluster.example.com/svc"',
            )}
          </HelperTextItem>
        </HelperText>
      </FormHelperText>
    </FormGroup>
  );
};

export default SinkUri;
