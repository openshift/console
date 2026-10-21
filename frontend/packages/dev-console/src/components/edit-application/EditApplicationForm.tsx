import type { FC } from 'react';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormFooter, FlexForm, FormBody } from '@console/shared';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import type { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import AdvancedSection from '../import/advanced/AdvancedSection';
import AppSection from '../import/app/AppSection';
import BuilderImageTagSelector from '../import/builder/BuilderImageTagSelector';
import BuilderSection from '../import/builder/BuilderSection';
import DockerSection from '../import/git/DockerSection';
import GitSection from '../import/git/GitSection';
import ImageSearchSection from '../import/image-search/ImageSearchSection';
import type { GitImportFormData } from '../import/import-types';
import JarSection from '../import/jar/section/JarSection';
import { BuildSection } from '../import/section/build-section/BuildSection';
import FormSection from '../import/section/FormSection';
import IconSection from '../import/section/IconSection';
import PipelineSection from '../pipeline-section/pipeline/PipelineSection';
import type { AppResources } from './edit-application-types';
import { ApplicationFlowType, getFlowTypePageTitle } from './edit-application-utils';

export interface EditApplicationFormProps {
  flowType: ApplicationFlowType;
  builderImages?: NormalizedBuilderImages;
  appResources: AppResources;
}

const EditApplicationForm: FC<
  FormikProps<FormikValues & GitImportFormData> & EditApplicationFormProps
> = ({
  handleSubmit,
  handleReset,
  values,
  flowType,
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
      <PageHeading title={t(getFlowTypePageTitle(flowType))} />
      <FlexForm onSubmit={handleSubmit}>
        <FormBody flexLayout>
          {flowType === ApplicationFlowType.Git && <GitSection builderImages={builderImages} />}
          {flowType === ApplicationFlowType.Dockerfile && (
            <GitSection builderImages={builderImages} flowType={flowType} />
          )}
          {flowType === ApplicationFlowType.Git && (
            <BuilderSection
              builderImages={builderImages}
              existingPipeline={appResources?.pipeline?.data}
            />
          )}
          {flowType === ApplicationFlowType.Dockerfile && <DockerSection />}
          {flowType === ApplicationFlowType.JarUpload && <JarSection />}
          {flowType === ApplicationFlowType.Container && <ImageSearchSection />}
          {(flowType === ApplicationFlowType.Container ||
            flowType === ApplicationFlowType.JarUpload) && <IconSection />}
          {flowType === ApplicationFlowType.JarUpload && builderImages && (
            <FormSection>
              <BuilderImageTagSelector
                selectedBuilderImage={builderImages[values.image.selected]}
                selectedImageTag={values.image.tag}
                showImageInfo={false}
              />
            </FormSection>
          )}
          <AppSection project={values.project} />
          {flowType !== ApplicationFlowType.Container &&
            flowType !== ApplicationFlowType.JarUpload && <BuildSection values={values} />}
          {flowType !== ApplicationFlowType.Container &&
            flowType !== ApplicationFlowType.JarUpload && (
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
