import * as React from 'react';
import {
  Alert,
  AlertVariant,
  Content,
  Title,
  TitleSizes,
  FormGroup,
  ClipboardCopy,
  ClipboardCopyVariant,
} from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation, Trans } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { GitProvider } from '@console/git-service/src';
import { ExternalLink } from '@console/internal/components/utils';
import { RepositoryFormValues } from '../types';

const RepositoryOverview = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<RepositoryFormValues>();
  return (
    <FormSection>
      <FormGroup fieldId="alert-message">
        <Alert
          isInline
          variant={values?.webhook?.autoAttach ? AlertVariant.success : AlertVariant.info}
          title={
            values?.webhook?.autoAttach
              ? t('pipelines-plugin~Webhook attached to the Git Repository')
              : t('pipelines-plugin~Could not attach webhook to the Git Repository.')
          }
        >
          {!values?.webhook?.autoAttach &&
            t(
              'pipelines-plugin~Please follow the instructions below to attach the webhook manually.',
            )}
        </Alert>
      </FormGroup>
      <FormGroup fieldId="title">
        <Title headingLevel="h4" size={TitleSizes.xl} data-test="repository-overview-title">
          {t('pipelines-plugin~Git repository added.')}
        </Title>
      </FormGroup>
      <FormGroup fieldId="instructions">
        <Content component="p">
          <Trans t={t} ns="pipelines-plugin">
            Copy this code to <code className="co-code">.tekton</code> directory in your{' '}
            <a href={values.gitUrl}>Git repository</a>.{' '}
            <ExternalLink
              text={t('pipelines-plugin~Learn more')}
              href="https://pipelinesascode.com/docs/guide/authoringprs/"
            />
          </Trans>
        </Content>
        <Content component="p">
          <Trans t={t} ns="pipelines-plugin">
            You can now add PipelineRuns to the <code className="co-code">.tekton</code> directory
            in your <a href={values.gitUrl}>Git repository</a> and execute them on Git events.
          </Trans>
        </Content>
      </FormGroup>
      <FormGroup fieldId="step-1">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 1')}
        </Title>
        <Trans t={t} ns="pipelines-plugin">
          <Content component="p">
            In your repository, create the <code className="co-code">.tekton</code> directory to
            store you pipeline.
          </Content>
        </Trans>
      </FormGroup>
      <FormGroup fieldId="step-2">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 2')}
        </Title>
        <Trans t={t} ns="pipelines-plugin">
          <Content component="p">
            In the <code className="co-code">.tekton</code> directory, create a new file called
            <code className="co-code">push.yaml</code> and add the following code:
          </Content>
        </Trans>
        <ClipboardCopy
          isCode
          hoverTip={t('pipelines-plugin~Copy to clipboard')}
          clickTip={t('pipelines-plugin~Copied to clipboard')}
          variant={ClipboardCopyVariant.expansion}
          style={{ marginTop: '.5em' }}
        >
          {values.yamlData}
        </ClipboardCopy>
      </FormGroup>
      <FormGroup fieldId="step-3">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 3')}
        </Title>
        <Content component="p">
          {t('pipelines-plugin~Commit these changes and push them to your Git repository.')}
        </Content>
      </FormGroup>
      {!(
        values.gitProvider === GitProvider.GITHUB &&
        values.method === GitProvider.GITHUB &&
        values.githubAppAvailable === true
      ) &&
        values?.webhook?.url &&
        !values?.webhook?.autoAttach && (
          <FormGroup fieldId="step-4">
            <Title headingLevel="h4" size={TitleSizes.md}>
              {t('pipelines-plugin~Step 4')}
            </Title>
            <Content component="p">
              <Trans t={t} ns="pipelines-plugin">
                Webhook URL to configure the webhook in your Git repository:
              </Trans>
            </Content>
            <Content component="p">
              <ClipboardCopy
                isReadOnly
                hoverTip={t('pipelines-plugin~Copy to clipboard')}
                clickTip={t('pipelines-plugin~Copied to clipboard')}
                style={{ flex: '1', marginTop: '.5em' }}
              >
                {values.webhook.url}
              </ClipboardCopy>
            </Content>
          </FormGroup>
        )}
      <FormGroup fieldId="step-5">
        <Content component="p">
          <Trans t={t} ns="pipelines-plugin">
            You can install Tekton CLI from{' '}
            <ExternalLink
              text={t('pipelines-plugin~releases')}
              href="https://github.com/openshift-pipelines/pipelines-as-code/releases"
            />{' '}
            page and generate example pipelineruns using the{' '}
            <code className="co-code">tkn pac generate</code>
          </Trans>
        </Content>
        <br />
        <Trans t={t} ns="pipelines-plugin">
          Your Git repository is now configured to run <code className="co-code">push.yaml</code> on
          every Git push event.
        </Trans>
      </FormGroup>
    </FormSection>
  );
};

export default RepositoryOverview;
