import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter } from '@console/shared/src/components/form-utils';
import { GitImportFormProps } from './import-types';
import GitSection from './git/GitSection';
import BuilderSection from './builder/BuilderSection';
import AppSection from './app/AppSection';
import AdvancedSection from './advanced/AdvancedSection';
import DockerSection from './git/DockerSection';
import PipelineSection from './pipeline/PipelineSection';
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
    <Form onSubmit={handleSubmit} data-test-id="import-git-form">
      <GitSection builderImages={builderImages} />
      <BuilderSection image={values.image} builderImages={builderImages} />
      <DockerSection buildStrategy={values.build.strategy} />
      <AppSection
        project={values.project}
        noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
      />
      <ResourceSection />
      <PipelineSection builderImages={builderImages} />
      <AdvancedSection values={values} />
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </Form>
  );
};

export default GitImportForm;
