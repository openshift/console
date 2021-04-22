import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter, FormBody } from '@console/shared/src/components/form-utils';
import { DevfileImportFormProps } from '../import-types';
import GitSection from '../git/GitSection';
import AppSection from '../app/AppSection';
<<<<<<< HEAD
import { useDevfileServer, useDevfileDirectoryWatcher } from './devfileHooks';
=======
import { useDefileServer, useDevfileDirectoryWatcher } from './devfileHooks';
import { createComponentName, detectGitRepoName } from '../import-validation-utils';
>>>>>>> 68c3ef287 (update devfile form for preselected devfile)

const DevfileImportForm: React.FC<FormikProps<FormikValues> & DevfileImportFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  builderImages,
  isSubmitting,
  dirty,
  projects,
  setFieldValue,
}) => {
  const { t } = useTranslation();
<<<<<<< HEAD
  const [, devfileParseError] = useDevfileServer(values, setFieldValue);
=======
  const searchParams = new URLSearchParams(window.location.search);
  const gitRepoUrl = searchParams.get('gitRepoUrl');
  const sampleGitRepoUrl = searchParams.get('sampleGitRepoUrl');
  const [, devfileParseError] = useDefileServer(values, setFieldValue);
>>>>>>> 68c3ef287 (update devfile form for preselected devfile)
  useDevfileDirectoryWatcher(values, setFieldValue);
  React.useEffect(() => {
    if (sampleGitRepoUrl) {
      const gitRepoName = detectGitRepoName(sampleGitRepoUrl);
      setFieldValue('name', createComponentName(gitRepoName));
      setFieldValue('git.url', sampleGitRepoUrl);
    }
  }, [sampleGitRepoUrl, setFieldValue]);

  return (
    <form onSubmit={handleSubmit} data-test-id="import-devfile-form">
      <FormBody>
        {devfileParseError && (
          <Alert isInline variant="danger" title={t('devconsole~Import is not possible.')}>
            {devfileParseError}
          </Alert>
        )}
        <GitSection
          buildStrategy="Devfile"
          builderImages={builderImages}
          showSample={!sampleGitRepoUrl}
          defaultSample={{
            url: gitRepoUrl || 'https://github.com/redhat-developer/devfile-sample',
          }}
          hideAdvancedGitOptions={!!sampleGitRepoUrl}
        />
        <AppSection
          project={values.project}
          noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
        />
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(errors)}
        resetLabel={t('devconsole~Cancel')}
      />
    </form>
  );
};

export default DevfileImportForm;
