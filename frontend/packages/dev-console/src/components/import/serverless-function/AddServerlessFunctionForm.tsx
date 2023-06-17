import * as React from 'react';
import {
  Alert,
  Card,
  CardBody,
  CardTitle,
  Flex,
  FlexItem,
  ValidatedOptions,
} from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { WatchK8sResultsObject } from '@console/dynamic-plugin-sdk';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { getGitService, GitProvider } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import { ExternalLink } from '@console/internal/components/utils';
import * as intellijImg from '@console/internal/imgs/logos/intellij.png';
import * as vscodeImg from '@console/internal/imgs/logos/vscode.png';
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
import AdvancedSection from '../advanced/AdvancedSection';
import AppSection from '../app/AppSection';
import GitSection from '../git/GitSection';
import { notSupportedRuntime } from '../import-types';
import ServerlessFunctionStrategySection from './ServerlessFunctionStrategySection';
import './AddServerlessFunctionForm.scss';

type AddServerlessFunctionFormProps = {
  builderImages?: NormalizedBuilderImages;
  projects: WatchK8sResultsObject<K8sResourceKind[]>;
};

type ExtensionCardProps = {
  icon: string;
  link: string;
  title: string;
  description: string;
};

enum SupportedRuntime {
  node = 'nodejs',
  nodejs = 'nodejs',
  typescript = 'nodejs',
  quarkus = 'java',
}

const ExtensionCard: React.FC<ExtensionCardProps> = ({ icon, link, title, description }) => {
  const { t } = useTranslation();
  return (
    <Card>
      <CardTitle>
        <div className="odc-serverless-extensions-card-title">
          <div className="odc-serverless-extensions-card-title__icon">
            <span className="odc-serverless-extensions-logo__bg">
              <img className="odc-serverless-extensions-logo__img" src={icon} aria-hidden alt="" />
            </span>
          </div>
          <div className="odc-serverless-extensions-card-title__name">
            <h1 className="odc-serverless-extensions-card-title__name__link">
              <ExternalLink href={link} text={title} />
            </h1>
            <small className="odc-serverless-extension-provider text-muted">
              {t('devconsole~Provided by Red Hat')}
            </small>
          </div>
        </div>
      </CardTitle>
      <CardBody>
        <p>{description}</p>
      </CardBody>
    </Card>
  );
};

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
        </FlexItem>
        <FlexItem
          flex={{ default: 'flex_1' }}
          className="pf-u-display-none pf-u-display-flex-on-lg"
        >
          <Flex
            direction={{ default: 'column', sm: 'row' }}
            spaceItems={{ default: 'spaceItemsNone' }}
          >
            <FlexItem
              className="odc-serverless-extensions-card"
              flex={{ default: 'flex_1' }}
              data-test="odc-serverless-vscode-extension-card"
            >
              <ExtensionCard
                icon={vscodeImg}
                link="https://marketplace.visualstudio.com/items?itemName=redhat.vscode-knative"
                title={t('devconsole~VSCode')}
                description={t(
                  'devconsole~This extension for Knative provides the app developer the tools and experience needed when working with Knative & Serverless Functions on a Kubernetes cluster. Using this extension, developers can develop and deploy functions in a serverless way through guided IDE workflow.',
                )}
              />
            </FlexItem>
            <FlexItem
              className="odc-serverless-extensions-card"
              flex={{ default: 'flex_1' }}
              data-test="odc-serverless-intellij-extension-card"
            >
              <ExtensionCard
                icon={intellijImg}
                link="https://plugins.jetbrains.com/plugin/16476-knative--serverless-functions-by-red-hat"
                title={t('devconsole~IntelliJ')}
                description={t(
                  'devconsole~A plugin for working with Knative on a OpenShift or Kubernetes cluster. This plugin allows developers to view and deploy their applications in a serverless way.',
                )}
              />
            </FlexItem>
          </Flex>
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
