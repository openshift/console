import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { PageHeading } from '@console/internal/components/utils';
import { FormFooter, FlexForm, FormBody } from '@console/shared';
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
import JarSection from '../import/jar/section/JarSection';
import BuilderImageTagSelector from '../import/builder/BuilderImageTagSelector';
import FormSection from '../import/section/FormSection';

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
      <PageHeading title={createFlowType} />
      <FlexForm onSubmit={handleSubmit}>
        <FormBody flexLayout>
          {createFlowType !== CreateApplicationFlow.Container &&
            createFlowType !== CreateApplicationFlow.JarUpload && (
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
          {createFlowType === CreateApplicationFlow.JarUpload && <JarSection />}
          {createFlowType === CreateApplicationFlow.Container && <ImageSearchSection />}
          {(createFlowType === CreateApplicationFlow.Container ||
            createFlowType === CreateApplicationFlow.JarUpload) && <IconSection />}
          {createFlowType === CreateApplicationFlow.JarUpload && builderImages && (
            <FormSection>
              <BuilderImageTagSelector
                selectedBuilderImage={builderImages[values.image.selected]}
                selectedImageTag={values.image.tag}
                showImageInfo={false}
              />
            </FormSection>
          )}
          <AppSection project={values.project} />
          {createFlowType !== CreateApplicationFlow.Container &&
            createFlowType !== CreateApplicationFlow.JarUpload && (
              <PipelineSection
                builderImages={builderImages}
                existingPipeline={appResources?.pipeline?.data}
              />
            )}
          <AdvancedSection values={values} appResources={appResources} />
        </FormBody>
        <FormFooter
          handleReset={handleReset}
          errorMessage={status && status.submitError}
          isSubmitting={isSubmitting}
          submitLabel={t('devconsole~Save')}
          disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
          resetLabel={t('devconsole~Cancel')}
          sticky
        />
      </FlexForm>
    </>
  );
};

export default EditApplicationForm;
