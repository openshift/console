import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { Form, ActionGroup, ButtonVariant, Button } from '@patternfly/react-core';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ImageSearchSection from './image-search/ImageSearchSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ServerlessSection from './serverless/ServerlessSection';
import RouteCheckbox from './route/RouteCheckbox';
import FormSectionDivider from './section/FormSectionDivider';

export interface DeployImageFormProps {
  builderImages?: NormalizedBuilderImages;
}

const DeployImageForm: React.FC<FormikProps<FormikValues> & DeployImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form className="co-deploy-image" onSubmit={handleSubmit}>
    <AppSection project={values.project} />
    <FormSectionDivider />
    <ImageSearchSection />
    <FormSectionDivider />
    <ServerlessSection />
    <RouteCheckbox />
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
