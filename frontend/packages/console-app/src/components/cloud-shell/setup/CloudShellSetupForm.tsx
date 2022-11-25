import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FlexForm, FormFooter, FormBody } from '@console/shared';
import NamespaceSection from './NamespaceSection';

const CloudShellSetupForm: React.FC<Pick<
  FormikProps<FormikValues>,
  'errors' | 'handleSubmit' | 'handleReset' | 'status' | 'isSubmitting'
>> = ({ errors, handleSubmit, handleReset, status, isSubmitting }) => {
  const { t } = useTranslation();
  return (
    <FlexForm onSubmit={handleSubmit} className="co-m-pane__form">
      <FormBody>
        <NamespaceSection />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('console-app~Start')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel={t('console-app~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default CloudShellSetupForm;
