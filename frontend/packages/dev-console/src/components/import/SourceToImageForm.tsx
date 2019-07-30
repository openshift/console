import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { Form, ActionGroup, ButtonVariant, Button } from '@patternfly/react-core';
import { SourceToImageFormProps } from './import-types';
import GitSection from './git/GitSection';
import BuilderSection from './builder/BuilderSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ServerlessSection from './serverless/ServerlessSection';
import RouteCheckbox from './route/RouteCheckbox';
import FormSectionDivider from './section/FormSectionDivider';

const SourceToImageForm: React.FC<FormikProps<FormikValues> & SourceToImageFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  builderImages,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form onSubmit={handleSubmit}>
    <AppSection project={values.project} />
    <FormSectionDivider />
    <ServerlessSection />
    <BuilderSection image={values.image} builderImages={builderImages} />
    <GitSection showSample />
    <FormSectionDivider />
    <RouteCheckbox />
    <AdvancedSection values={values} />
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <ActionGroup className="pf-c-form">
        <Button
          type="submit"
          variant={ButtonVariant.primary}
          isDisabled={!dirty || !_.isEmpty(errors)}
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

export default SourceToImageForm;
