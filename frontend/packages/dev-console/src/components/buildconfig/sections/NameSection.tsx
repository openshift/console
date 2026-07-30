import type { FC } from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import FormSection from '../../import/section/FormSection';

export type NameSectionFormData = {
  formData: {
    name?: string;
  };
};

const NameSection: FC<{}> = () => {
  const { t } = useTranslation('devconsole');

  const [, meta] = useField<string>('formData.name');
  const isNew = !meta.initialValue;

  return (
    <FormSection dataTest="section name">
      <InputField
        label={t('Name')}
        name="formData.name"
        type={TextInputTypes.text}
        dataTest="form-name-input"
        isDisabled={!isNew}
        required
      />
    </FormSection>
  );
};

export default NameSection;
