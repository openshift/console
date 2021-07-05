import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormBody, FormFooter } from '@console/dynamic-plugin-sdk/src/shared/components/form-utils';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import AdvancedSection from './advanced/AdvancedSection';
import AppSection from './app/AppSection';
import BuilderSection from './builder/BuilderSection';
import DockerSection from './git/DockerSection';
import GitSection from './git/GitSection';
import { GitImportFormProps } from './import-types';
import ResourceSection from './section/ResourceSection';

const GitImportForm: React.FC<FormikProps<FormikValues> & GitImportFormProps> = ({
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
  return (
    <form onSubmit={handleSubmit} data-test-id="import-git-form">
      <FormBody>
        <GitSection buildStrategy={values.build.strategy} builderImages={builderImages} />
        <BuilderSection image={values.image} builderImages={builderImages} />
        <DockerSection buildStrategy={values.build.strategy} />
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
        <ResourceSection />
        <PipelineSection builderImages={builderImages} />
        <AdvancedSection values={values} />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </form>
  );
};

export default GitImportForm;
