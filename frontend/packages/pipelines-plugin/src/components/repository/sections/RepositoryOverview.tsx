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
            Copy this code to .tekton directory in your <a href={values.gitUrl}>Git repository</a>.{' '}
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
            You can now add PipelineRuns to the .tekton directory in your{' '}
            <a href={values.gitUrl}>Git repository</a> and execute them on Git events.
          </Trans>
        </Text>
      </FormGroup>
      <FormGroup fieldId="step-1">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 1')}
        </Title>
        <Text>
          {t(
            'pipelines-plugin~In your repository, create the .tekton directory to store you pipeline.',
          )}
        </Text>
      </FormGroup>
      <FormGroup fieldId="step-2">
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 2')}
        </Title>
        <Text>
          {t(
            'pipelines-plugin~In the .tekton directory, create a new file called "push.yaml" and add the following code:',
          )}
        </Text>
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
        <Title headingLevel="h4" size={TitleSizes.md}>
          {t('pipelines-plugin~Step 4')}
        </Title>
        <Text>
          <Trans t={t} ns="pipelines-plugin">
            Install Tekton CLI from{' '}
            <ExternalLink
              text={t('pipelines-plugin~releases')}
              href="https://github.com/openshift-pipelines/pipelines-as-code/releases"
            />{' '}
            page. You can generate example pipelineruns using the `tkn pac generate`
          </Trans>
        </Text>
        <br />
        <Text>
          {t(
            'pipelines-plugin~Your Git repository is now configured to run push.yaml on every Git push event.',
          )}
        </Text>
      </FormGroup>
    </FormSection>
  );
};

export default RepositoryOverview;
