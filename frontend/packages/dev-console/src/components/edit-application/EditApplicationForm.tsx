import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Form } from '@patternfly/react-core';
import { PageHeading } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import GitSection from '../import/git/GitSection';
import BuilderSection from '../import/builder/BuilderSection';
import DockerSection from '../import/git/DockerSection';
import IconSection from '../import/section/IconSection';
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
}) => {
  const { t } = useTranslation();
  return (
    <>
      <PageHeading title={createFlowType} style={{ padding: '0px' }} />
      <Form onSubmit={handleSubmit}>
        {createFlowType !== CreateApplicationFlow.Container && (
          <GitSection builderImages={builderImages} />
        )}
        {createFlowType === CreateApplicationFlow.Git && (
          <BuilderSection
            image={values.image}
            builderImages={builderImages}
            existingPipeline={appResources?.pipeline?.data}
          />
        )}
        {createFlowType === CreateApplicationFlow.Dockerfile && (
          <DockerSection buildStrategy={values.build.strategy} />
        )}
        {createFlowType === CreateApplicationFlow.Container && <ImageSearchSection />}
        {createFlowType === CreateApplicationFlow.Container && <IconSection />}
        <AppSection project={values.project} />
        <PipelineSection
          builderImages={builderImages}
          existingPipeline={appResources?.pipeline?.data}
        />
        <AdvancedSection values={values} appResources={appResources} />
        <FormFooter
          handleReset={handleReset}
          errorMessage={status && status.submitError}
          isSubmitting={isSubmitting}
          submitLabel={t('devconsole~Save')}
          disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
          resetLabel={t('devconsole~Cancel')}
          sticky
        />
      </Form>
    </>
  );
};

export default EditApplicationForm;
