import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import { SourceToImageFormProps } from './import-types';
import GitSection from './git/GitSection';
import BuilderSection from './builder/BuilderSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import ResourceSection from './section/ResourceSection';

const SourceToImageForm: React.FC<FormikProps<FormikValues> & SourceToImageFormProps> = ({
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
    <form onSubmit={handleSubmit}>
      <FormBody>
        <BuilderSection image={values.image} builderImages={builderImages} />
        <GitSection showSample builderImages={builderImages} />
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
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </form>
  );
};

export default SourceToImageForm;
