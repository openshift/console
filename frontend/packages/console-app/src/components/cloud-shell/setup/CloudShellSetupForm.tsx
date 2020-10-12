import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { Form } from '@patternfly/react-core';
import { FormFooter } from '@console/shared';
import NamespaceSection from './NamespaceSection';

const CloudShellSetupForm: React.FC<Pick<
  FormikProps<FormikValues>,
  'errors' | 'handleSubmit' | 'handleReset' | 'status' | 'isSubmitting'
>> = ({ errors, handleSubmit, handleReset, status, isSubmitting }) => {
  const { t } = useTranslation();
  return (
    <Form onSubmit={handleSubmit} className="co-m-pane__form">
      <NamespaceSection />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('cloudshell~Start')}
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel={t('cloudshell~Cancel')}
        sticky
      />
    </Form>
  );
};

export default CloudShellSetupForm;
