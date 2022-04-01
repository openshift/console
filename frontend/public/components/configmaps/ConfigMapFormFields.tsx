import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { FormSection, TextInputTypes } from '@patternfly/react-core';
import { CheckboxField, InputField } from '@console/shared/src/components/formik-fields';
import KeyValueFileInputField from '@console/shared/src/components/formik-fields/key-value-file-input-field/KeyValueFileInputField';
import { isBase64 } from './configmap-utils';

const ConfigMapFormFields: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const onChange = (value: string, keyIndex: string) => {
    setFieldValue(`${keyIndex}.isBase64`, isBase64(value));
  };

  return (
    <FormSection>
      <InputField
        type={TextInputTypes.text}
        required
        isDisabled={!values.isCreateFlow}
        name="formData.name"
        label={t('public~Name')}
        data-test="configmap-name"
        helpText={t('public~A unique name for the ConfigMap within the project')}
      />

      <CheckboxField
        name="formData.immutable"
        label={t('public~Immutable')}
        data-test="configmap-immutable"
        helpText={t(
          'public~Immutable, if set to true, ensures that data stored in the ConfigMap cannot be updated',
        )}
      />

      <KeyValueFileInputField
        label={t('public~Data')}
        helpText={t('public~Data contains the configuration data that is in UTF-8 range')}
        name="formData.data"
        data-test="configmap-key-value-pair"
        entries={[{ key: '', value: '' }]}
        onChange={onChange}
      />

      <KeyValueFileInputField
        label={t('public~Binary Data')}
        helpText={t('public~BinaryData contains the binary data that is not in UTF-8 range')}
        name="formData.binaryData"
        data-test="configmap-key-value-pair"
        entries={[{ key: '', value: '' }]}
      />
    </FormSection>
  );
};

export default ConfigMapFormFields;
