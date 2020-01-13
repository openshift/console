import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form, ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { ButtonBar, PageHeading } from '@console/internal/components/utils';
import GitSection from '../import/git/GitSection';
import BuilderSection from '../import/builder/BuilderSection';
import DockerSection from '../import/git/DockerSection';
import AdvancedSection from '../import/advanced/AdvancedSection';
import AppSection from '../import/app/AppSection';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ImageSearchSection from '../import/image-search/ImageSearchSection';
import { CreateApplicationFlow } from './edit-application-utils';

export interface EditApplicationFormProps {
  pageHeading: string;
  builderImages?: NormalizedBuilderImages;
}

const EditApplicationForm: React.FC<FormikProps<FormikValues> & EditApplicationFormProps> = ({
  handleSubmit,
  handleReset,
  values,
  pageHeading,
  builderImages,
  dirty,
  errors,
  status,
  isSubmitting,
}) => (
  <>
    <PageHeading title={pageHeading} style={{ padding: '0px' }} />
    <Form onSubmit={handleSubmit}>
      {pageHeading !== CreateApplicationFlow.Container && <GitSection />}
      {pageHeading === CreateApplicationFlow.Git && (
        <BuilderSection image={values.image} builderImages={builderImages} />
      )}
      {pageHeading === CreateApplicationFlow.Dockerfile && (
        <DockerSection buildStrategy={values.build.strategy} />
      )}
      {pageHeading === CreateApplicationFlow.Container && <ImageSearchSection />}
      <AppSection project={values.project} />
      <AdvancedSection values={values} />
      <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
        <ActionGroup className="pf-c-form">
          <Button
            type="submit"
            variant={ButtonVariant.primary}
            isDisabled={!dirty || !_.isEmpty(errors)}
            data-test-id="edit-app-save-button"
          >
            Save
          </Button>
          <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
            Cancel
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  </>
);

export default EditApplicationForm;
