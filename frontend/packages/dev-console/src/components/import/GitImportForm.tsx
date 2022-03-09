import * as React from 'react';
import { ValidatedOptions } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider, ImportStrategy } from '@console/git-service/src';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import { FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import AdvancedSection from './advanced/AdvancedSection';
import AppSection from './app/AppSection';
import DevfileStrategySection from './devfile/DevfileStrategySection';
import GitSection from './git/GitSection';
import { GitImportFormProps } from './import-types';
import ImportStrategySection from './ImportStrategySection';
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
  const searchParams = new URLSearchParams(window.location.search);
  const gitRepoUrl = searchParams.get('gitRepo');
  const formType = searchParams.get('formType');
  const importType = searchParams.get('importType');
  const {
    git: { validated, gitType },
  } = values;
  const showFullForm =
    importType === 'devfile' ||
    (validated !== ValidatedOptions.default && gitType !== GitProvider.INVALID);

  return (
    <form onSubmit={handleSubmit} data-test-id="import-git-form">
      <FormBody>
        <GitSection
          builderImages={builderImages}
          defaultSample={
            gitRepoUrl && {
              url: gitRepoUrl,
            }
          }
          formType={formType}
          importType={importType}
        />
        {showFullForm && (
          <>
            {importType === 'devfile' ? (
              <DevfileStrategySection />
            ) : (
              <ImportStrategySection builderImages={builderImages} />
            )}
            <AppSection
              project={values.project}
              noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
            />
            {values.import.selectedStrategy.type !== ImportStrategy.DEVFILE && (
              <>
                <ResourceSection />
                <PipelineSection builderImages={builderImages} />
                <AdvancedSection values={values} />
              </>
            )}
          </>
        )}
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
