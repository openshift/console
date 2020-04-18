import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form } from '@patternfly/react-core';
import { FormFooter } from '@console/shared';
import NamespaceSection from './NamespaceSection';

const CloudShellSetupForm: React.FC<Pick<
  FormikProps<FormikValues>,
  'errors' | 'handleSubmit' | 'handleReset' | 'status' | 'isSubmitting'
>> = ({ errors, handleSubmit, handleReset, status, isSubmitting }) => {
  return (
    <Form onSubmit={handleSubmit} className="co-m-pane__form">
      <NamespaceSection />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel="Start"
        disableSubmit={!_.isEmpty(errors) || isSubmitting}
        resetLabel="Cancel"
        sticky
      />
    </Form>
  );
};

export default CloudShellSetupForm;
