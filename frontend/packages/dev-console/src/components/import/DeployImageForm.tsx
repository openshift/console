import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { Form, ActionGroup, ButtonVariant, Button } from '@patternfly/react-core';
import { DeployImageFormProps } from './import-types';
import ImageSearchSection from './image-search/ImageSearchSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ResourceSection from './section/ResourceSection';

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
  <Form className="co-deploy-image" onSubmit={handleSubmit}>
    <ImageSearchSection />
    <AppSection
      project={values.project}
      noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
    />
    <ResourceSection />
    <AdvancedSection values={values} />
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <ActionGroup className="pf-c-form">
        <Button
          type="submit"
          variant={ButtonVariant.primary}
          isDisabled={!dirty || !_.isEmpty(errors)}
          data-test-id="deploy-image-form-submit-btn"
        >
          Create
        </Button>
        <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
          Cancel
        </Button>
      </ActionGroup>
    </ButtonBar>
  </Form>
);

export default DeployImageForm;
