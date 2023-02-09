import * as React from 'react';
import { Alert, ValidatedOptions } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { getGitService, GitProvider } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServerlessBuildStrategyType } from '@console/knative-plugin/src/types';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import { FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import GitSection from '../git/GitSection';
import { notSupportedRuntime } from '../import-types';
import ServerlessFunctionStrategySection from './ServerlessFunctionStrategySection';

type AddServerlessFunctionFormProps = {
  builderImages?: NormalizedBuilderImages;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
};

enum SupportedRuntime {
  node = 'nodejs',
  nodejs = 'nodejs',
  typescript = 'nodejs',
  quarkus = 'java',
}

const AddServerlessFunctionForm: React.FC<FormikProps<FormikValues> &
  AddServerlessFunctionFormProps> = ({
  values,
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
  builderImages,
  projects,
  setFieldValue,
  setStatus,
}) => {
  const { t } = useTranslation();

  const {
    git: { validated, url, type, ref, dir, secretResource },
    build: { strategy },
  } = values;
  const showFullForm =
    strategy === ServerlessBuildStrategyType.ServerlessFunction &&
    validated !== ValidatedOptions.default &&
    type !== GitProvider.INVALID;

  React.useEffect(() => {
    if (url) {
      const gitService = getGitService(url, type, ref, dir, secretResource);
      evaluateFunc(gitService)
        .then((res) => {
          if (res) {
            setStatus({});
            setFieldValue('build.env', res.values.builderEnvs);
            setFieldValue('deployment.env', res.values.runtimeEnvs);
            setFieldValue(
              'image.selected',
              notSupportedRuntime.indexOf(res.values.runtime) === -1
                ? SupportedRuntime[res.values.runtime]
                : res.values.runtime,
            );
            setFieldValue('import.showEditImportStrategy', true);
            setFieldValue(
              'image.tag',
              builderImages?.[SupportedRuntime[res.values.runtime]]?.recentTag?.name ?? '',
            );
            if (builderImages[SupportedRuntime[res.values.runtime]] === undefined) {
              setStatus({ errors: 'Builder Image is not present.' });
            }
          } else {
            setStatus({ errors: 'Not evaluated' });
          }
        })
        .catch((err) => {
          setStatus({ errors: err });
        });
    }
  }, [setFieldValue, url, type, ref, dir, secretResource, builderImages, setStatus]);
  return (
    <form onSubmit={handleSubmit} data-test="create-serverless-function-form">
      <FormBody>
        <GitSection builderImages={builderImages} />
        {showFullForm && (
          <>
            {builderImages && <ServerlessFunctionStrategySection builderImages={builderImages} />}
            <AppSection
              project={values.project}
              noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
            />
            <PipelineSection builderImages={builderImages} />
            <AdvancedSection values={values} />
          </>
        )}
        {validated !== ValidatedOptions.default &&
          strategy !== ServerlessBuildStrategyType.ServerlessFunction && (
            <Alert
              variant="warning"
              isInline
              title={t('devconsole~func.yaml is not present or builder strategy is not s2i')}
            >
              <p>
                {t(
                  'devconsole~func.yaml must be present or builder strategy should be s2i to create a Serverless function',
                )}
              </p>
            </Alert>
          )}
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        sticky
        disableSubmit={!dirty || !_.isEmpty(status?.errors) || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
      />
    </form>
  );
};

export default AddServerlessFunctionForm;
