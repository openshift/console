import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { DevfileImportFormProps } from './import-types';
import GitSection from './git/GitSection';
import AppSection from './app/AppSection';

const DevfileImportForm: React.FC<FormikProps<FormikValues> & DevfileImportFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  projects,
}) => (
  <Form onSubmit={handleSubmit} data-test-id="import-devfile-form">
    <GitSection />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
    />
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Create"
      sticky
      disableSubmit={!dirty || !_.isEmpty(errors)}
      resetLabel="Cancel"
    />
  </Form>
);

export default DevfileImportForm;