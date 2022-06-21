import * as React from 'react';
import { Flex, FlexItem, Text, Title, TitleSizes, FormGroup } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation, Trans } from 'react-i18next';
import EditorField from '@console/dev-console/src/components/buildconfig/sections/EditorField';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { ExternalLink } from '@console/internal/components/utils';
import YAMLEditorToolbar from '@console/shared/src/components/editor/YAMLEditorToolbar';
import CopyPipelineRunButton from '../form-fields/CopyPipelineRunButton';
import { RepositoryFormValues } from '../types';

const RepositoryOverview = () => {
  const { t } = useTranslation();
  const { values } = useFormikContext<RepositoryFormValues>();
  return (
    <FormSection>
      <FormGroup fieldId="title">
        <Title headingLevel="h4" size={TitleSizes.xl}>
          {t('pipelines-plugin~Git repository added.')}
        </Title>
        <Text>
          <Trans t={t} ns="pipelines-plugin">
            Copy this code to <code className="co-code">.tekton</code> directory in your{' '}
            <a href={values.gitUrl}>Git repository</a>.{' '}
            <ExternalLink
              text={t('pipelines-plugin~Learn more')}
              href="https://pipelinesascode.com/docs/guide/authoringprs/"
            />
          </Trans>
        </Text>
      </FormGroup>
      <FormGroup fieldId="instructions">
        <Text>
          <Trans t={t} ns="pipelines-plugin">
            You can now add PipelineRuns to the <code className="co-code">.tekton</code> directory
            in your <a href={values.gitUrl}>Git repository</a> and execute them on Git events.
          </Trans>
        </Text>
      </FormGroup>
      <FormGroup fieldId="step-1">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 1')}
        </Title>
        <Trans t={t} ns="pipelines-plugin">
          <Text>
            In your repository, create the <code className="co-code">.tekton</code> directory to
            store you pipeline.
          </Text>
        </Trans>
      </FormGroup>
      <FormGroup fieldId="step-2">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 2')}
        </Title>
        <Trans t={t} ns="pipelines-plugin">
          <Text>
            In the <code className="co-code">.tekton</code> directory, create a new file called
            <code className="co-code">push.yaml</code> and add the following code:
          </Text>
        </Trans>
        <>
          <YAMLEditorToolbar showShortcuts toolbarLinks={[]} />
          <EditorField
            name="yamlData"
            height={200}
            language="yaml"
            theme="console"
            options={{
              lineHeight: 20,
              readOnly: false,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
            }}
          />
          <Flex style={{ marginTop: '16px' }}>
            <FlexItem align={{ default: 'alignRight' }}>
              {' '}
              <CopyPipelineRunButton text={values.yamlData} />
            </FlexItem>
          </Flex>
        </>
      </FormGroup>
      <FormGroup fieldId="step-3">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 3')}
        </Title>
        <Text>
          {t('pipelines-plugin~Commit these changes and push them to your Git repository.')}
        </Text>
      </FormGroup>
      <FormGroup fieldId="step-4">
        <Text>
          <Trans t={t} ns="pipelines-plugin">
            You can install Tekton CLI from{' '}
            <ExternalLink
              text={t('pipelines-plugin~releases')}
              href="https://github.com/openshift-pipelines/pipelines-as-code/releases"
            />{' '}
            page and generate example pipelineruns using the{' '}
            <code className="co-code">tkn pac generate</code>
          </Trans>
        </Text>
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
