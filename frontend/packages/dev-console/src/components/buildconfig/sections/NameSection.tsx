import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared';
import FormSection from '../../import/section/FormSection';

export type NameSectionFormData = {
  formData: {
    name?: string;
  };
};

const NameSection: React.FC<{}> = () => {
  const { t } = useTranslation();

  const [, meta] = useField<string>('formData.name');
  const isNew = !meta.initialValue;

  return (
    <FormSection dataTest="section name">
      <InputField
        label={t('devconsole~Name')}
        name="formData.name"
        type={TextInputTypes.text}
        isDisabled={!isNew}
        required
      />
    </FormSection>
  );
};

export default NameSection;
