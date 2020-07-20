import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { Form } from '@patternfly/react-core';
import { DeployImageFormProps } from './import-types';
import ImageSearchSection from './image-search/ImageSearchSection';
import IconSection from './section/IconSection';
import AppSection from './app/AppSection';
import ResourceSection from './section/ResourceSection';
import AdvancedSection from './advanced/AdvancedSection';

const DeployImageForm: React.FC<FormikProps<FormikValues> & DeployImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  projects,
}) => (
  <Form className="co-deploy-image" data-test-id="deploy-image-form" onSubmit={handleSubmit}>
    <ImageSearchSection />
    <IconSection />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
    />
    <ResourceSection />
    <AdvancedSection values={values} />
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

export default DeployImageForm;
