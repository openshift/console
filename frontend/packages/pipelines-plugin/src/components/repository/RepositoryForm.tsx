import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { FormFooter, FlexForm, FormBody, FormHeader, InputField } from '@console/shared';

type RepositoryFormProps = FormikProps<FormikValues>;

export const RepositoryForm: React.FC<RepositoryFormProps> = ({
  status,
  isSubmitting,
  dirty,
  handleReset,
  handleSubmit,
  errors,
}) => {
  const { t } = useTranslation();

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody>
        <FormHeader title={t('pipelines-plugin~Create Repository')} />
        <FormSection>
          <InputField
            label={t('pipelines-plugin~Name')}
            name="name"
            type={TextInputTypes.text}
            required
          />
          <InputField
            label={t('pipelines-plugin~Git Repository')}
            name="gitUrl"
            type={TextInputTypes.text}
            required
          />
          <InputField
            label={t('pipelines-plugin~Token')}
            name="accessToken"
            type={TextInputTypes.text}
          />
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('pipelines-plugin~Create')}
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('pipelines-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};
