import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { Alert } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { FormFooter, FormBody } from '@console/shared/src/components/form-utils';
import { DevfileImportFormProps } from '../import-types';
import GitSection from '../git/GitSection';
import AppSection from '../app/AppSection';
import { useDevfileServer, useDevfileDirectoryWatcher } from './devfileHooks';

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
  const [, devfileParseError] = useDevfileServer(values, setFieldValue);
  useDevfileDirectoryWatcher(values, setFieldValue);

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
          defaultSample={{ url: 'https://github.com/redhat-developer/devfile-sample' }}
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
