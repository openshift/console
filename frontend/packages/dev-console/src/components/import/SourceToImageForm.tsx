import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { Form } from '@patternfly/react-core';
import { SourceToImageFormProps } from './import-types';
import GitSection from './git/GitSection';
import BuilderSection from './builder/BuilderSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ResourceSection from './section/ResourceSection';
import PipelineSection from './pipeline/PipelineSection';

const SourceToImageForm: React.FC<FormikProps<FormikValues> & SourceToImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  builderImages,
  status,
  isSubmitting,
  dirty,
  projects,
}) => (
  <Form onSubmit={handleSubmit}>
    <BuilderSection image={values.image} builderImages={builderImages} />
    <GitSection showSample builderImages={builderImages} />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
    />
    <ResourceSection />
    <PipelineSection builderImages={builderImages} />
    <AdvancedSection values={values} />
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Create"
      disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
      resetLabel="Cancel"
      sticky
    />
  </Form>
);

export default SourceToImageForm;
