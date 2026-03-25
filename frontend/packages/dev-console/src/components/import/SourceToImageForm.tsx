import type { FC } from 'react';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import PipelineSection from '../pipeline-section/pipeline/PipelineSection';
import AdvancedSection from './advanced/AdvancedSection';
import AppSection from './app/AppSection';
import BuilderSection from './builder/BuilderSection';
import GitSection from './git/GitSection';
import type { GitImportFormData, SourceToImageFormProps } from './import-types';
import { BuildOptions } from './import-types';
import NamespaceSection from './NamespaceSection';
import { BuildSection } from './section/build-section/BuildSection';
import { DeploySection } from './section/deploy-section/DeploySection';

export const SourceToImageForm: FC<
  FormikProps<FormikValues & GitImportFormData> & SourceToImageFormProps
> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  builderImages,
  status,
  isSubmitting,
  dirty,
  projects,
}) => {
  const { t } = useTranslation();
  const searchParams = new URLSearchParams(window.location.search);
  const imageStreamName = searchParams.get('imagestream');
  return (
    <form onSubmit={handleSubmit}>
      <FormBody>
        <BuilderSection builderImages={builderImages} />
        <GitSection showSample builderImages={builderImages} imageStreamName={imageStreamName} />
        <NamespaceSection />
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
        <BuildSection values={values} />
        {values.build?.option === BuildOptions.PIPELINES && (
          <PipelineSection builderImages={builderImages} />
        )}
        <DeploySection values={values} />
        <AdvancedSection values={values} />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </form>
  );
};
