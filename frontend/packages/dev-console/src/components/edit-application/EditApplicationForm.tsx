import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form } from '@patternfly/react-core';
import { PageHeading } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import GitSection from '../import/git/GitSection';
import BuilderSection from '../import/builder/BuilderSection';
import DockerSection from '../import/git/DockerSection';
import IconSection from '../import/section/IconSection';
import DevPreviewBadge from '@console/shared/src/components/badges/DevPreviewBadge';
import AdvancedSection from '../import/advanced/AdvancedSection';
import AppSection from '../import/app/AppSection';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import ImageSearchSection from '../import/image-search/ImageSearchSection';
import { CreateApplicationFlow } from './edit-application-utils';
import { AppResources } from './edit-application-types';

export interface EditApplicationFormProps {
  createFlowType: string;
  builderImages?: NormalizedBuilderImages;
  appResources: AppResources;
}

const EditApplicationForm: React.FC<FormikProps<FormikValues> & EditApplicationFormProps> = ({
  handleSubmit,
  handleReset,
  values,
  createFlowType,
  builderImages,
  dirty,
  errors,
  status,
  isSubmitting,
  appResources,
}) => (
  <>
    {createFlowType === CreateApplicationFlow.Devfile
      ? <PageHeading title={createFlowType} style={{ padding: '0px' }} badge={<DevPreviewBadge />} />
      : <PageHeading title={createFlowType} style={{ padding: '0px' }} />
    }
    <Form onSubmit={handleSubmit}>
      {createFlowType !== CreateApplicationFlow.Container && (
        <GitSection buildStrategy={values.build.strategy} builderImages={builderImages} />
      )}
      {createFlowType === CreateApplicationFlow.Git && (
        <BuilderSection image={values.image} builderImages={builderImages} />
      )}
      {createFlowType === CreateApplicationFlow.Dockerfile && (
        <DockerSection buildStrategy={values.build.strategy} />
      )}
      {createFlowType === CreateApplicationFlow.Container && <ImageSearchSection />}
      {createFlowType === CreateApplicationFlow.Container && <IconSection />}
      <AppSection project={values.project} />
      {createFlowType !== CreateApplicationFlow.Devfile && (
        <AdvancedSection values={values} appResources={appResources} />
      )}
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel="Save"
        disableSubmit={!dirty || !_.isEmpty(errors)}
        resetLabel="Cancel"
        sticky
      />
    </Form>
  </>
);

export default EditApplicationForm;
