import * as React from 'react';
import { Alert, Flex, FlexItem, ValidatedOptions } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { Trans, useTranslation } from 'react-i18next';
import { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { getGitService, GitProvider } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import { ExternalLink } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ServerlessBuildStrategyType } from '@console/knative-plugin/src/types';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import {
  CLUSTER_PIPELINE_NS,
  FLAG_OPENSHIFT_PIPELINE,
  FUNC_PIPELINE_RUNTIME_LABEL,
} from '@console/pipelines-plugin/src/const';
import { PipelineModel } from '@console/pipelines-plugin/src/models';
import { PipelineKind } from '@console/pipelines-plugin/src/types';
import { useFlag } from '@console/shared/src';
import { FlexForm, FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import { NormalizedBuilderImages } from '../../../utils/imagestream-utils';
import { notSupportedRuntime } from '../../../utils/serverless-functions';
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import GitSection from '../git/GitSection';
import ServerlessFunctionStrategySection from './ServerlessFunctionStrategySection';

import './AddServerlessFunctionForm.scss';

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

export const SERVERLESS_FUNCTION_DOCS_URL =
  'https://docs.openshift.com/serverless/latest/functions/serverless-functions-getting-started.html';

const AddServerlessFunctionForm: React.FC<
  FormikProps<FormikValues> & AddServerlessFunctionFormProps
> = ({
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
    image,
  } = values;
  const isPipelineEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);
  const [showPipelineSection, setShowPipelineSection] = React.useState<boolean>(false);
  const showFullForm =
    strategy === ServerlessBuildStrategyType.ServerlessFunction &&
    validated !== ValidatedOptions.default &&
    type !== GitProvider.INVALID;
  const [helpText, setHelpText] = React.useState<string>('');

  React.useEffect(() => {
    if (url) {
      const gitService = getGitService(url, type, ref, dir, secretResource);
      if (gitService) {
        gitService
          .isFuncYamlPresent()
          // eslint-disable-next-line consistent-return
          .then((isFuncYamlPresent) => {
            if (!isFuncYamlPresent) {
              setHelpText(t('devconsole~Unable to find func.yaml in the repository.'));
              setStatus({ errors: 'func.yaml not present' });
            } else {
              return evaluateFunc(gitService);
            }
          })
          .then((res) => {
            if (res) {
              setStatus({});
              setFieldValue('build.env', res?.values?.builderEnvs || []);
              setFieldValue('deployment.env', res?.values?.runtimeEnvs || []);
              setFieldValue(
                'image.selected',
                notSupportedRuntime.indexOf(res?.values?.runtime) === -1
                  ? SupportedRuntime[res?.values?.runtime]
                  : res?.values?.runtime,
              );
              setFieldValue('import.showEditImportStrategy', true);
              setFieldValue(
                'image.tag',
                builderImages?.[SupportedRuntime[res?.values?.runtime]]?.recentTag?.name ?? '',
              );
              if (res?.values?.builder && res?.values?.builder !== 's2i') {
                setHelpText(
                  t(
                    'devconsole~Unsupported builder strategy detected. s2i is currently supported.',
                  ),
                );
                setStatus({ errors: 'Builder strategy not supported' });
              }
              if (builderImages[SupportedRuntime[res?.values?.runtime]] === undefined) {
                setHelpText(
                  t('devconsole~Support for {{runtime}} is not yet available.', {
                    runtime: res?.values?.runtime,
                  }),
                );
                setStatus({ errors: 'Builder Image is not present' });
              }
            } else {
              setStatus({ errors: 'Not evaluated' });
            }
          })
          .catch((err) => {
            setStatus({ errors: err });
          });
      }
    }
  }, [setFieldValue, url, type, ref, dir, secretResource, builderImages, setStatus, t]);

  React.useEffect(() => {
    if (image.selected && isPipelineEnabled) {
      const fetchPipelineTemplate = async () => {
        const fetchedPipelines = (await k8sListResourceItems({
          model: PipelineModel,
          queryParams: {
            ns: CLUSTER_PIPELINE_NS,
            labelSelector: { matchLabels: { [FUNC_PIPELINE_RUNTIME_LABEL]: image?.selected } },
          },
        })) as PipelineKind[];
        if (fetchedPipelines.length > 0) {
          setShowPipelineSection(true);
        } else {
          setShowPipelineSection(false);
        }
      };
      fetchPipelineTemplate();
    }
  }, [image, isPipelineEnabled]);

  return (
    <FlexForm onSubmit={handleSubmit} data-test="create-serverless-function-form">
      <Flex direction={{ default: 'column', sm: 'row' }}>
        <FlexItem flex={{ default: 'flex_1' }} alignSelf={{ default: 'alignSelfFlexStart' }}>
          <FormBody flexLayout>
            <GitSection builderImages={builderImages} />
            {showFullForm && (
              <>
                {builderImages && (
                  <ServerlessFunctionStrategySection builderImages={builderImages} />
                )}
                <AppSection
                  project={values.project}
                  noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
                />
                {showPipelineSection && <PipelineSection builderImages={builderImages} />}
                <AdvancedSection values={values} />
              </>
            )}
            {validated !== ValidatedOptions.default &&
              validated !== ValidatedOptions.warning &&
              strategy !== ServerlessBuildStrategyType.ServerlessFunction && (
                <Alert
                  variant="warning"
                  isInline
                  title={t('devconsole~Serverless function cannot be created')}
                >
                  {helpText}
                  <p className="odc-func-form-helpText">
                    <Trans t={t} ns="devconsole">
                      <b>Tip:</b> Use the <code className="co-code">kn func create</code> command to
                      create the serverless function.
                    </Trans>
                  </p>
                  <ExternalLink
                    additionalClassName="odc-func-form-link"
                    href={SERVERLESS_FUNCTION_DOCS_URL}
                    text={t('devconsole~Learn more')}
                  />
                </Alert>
              )}
          </FormBody>
        </FlexItem>
      </Flex>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status && status.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Create')}
        disableSubmit={!dirty || !_.isEmpty(status?.errors) || !_.isEmpty(errors) || isSubmitting}
        resetLabel={t('devconsole~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default AddServerlessFunctionForm;
