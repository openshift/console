import * as React from 'react';
import { Flex, FlexItem, ValidatedOptions } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { GitProvider, ImportStrategy } from '@console/git-service/src';
import PipelineSection from '@console/pipelines-plugin/src/components/import/pipeline/PipelineSection';
import { FormBody, FormFooter } from '@console/shared/src/components/form-utils';
import { hasSampleQueryParameter } from '../../utils/samples';
import AdvancedSection from './advanced/AdvancedSection';
import AppSection from './app/AppSection';
import { DeploySection } from './DeploySection';
import DevfileStrategySection from './devfile/DevfileStrategySection';
import GitSection from './git/GitSection';
import { BuildOptions, GitImportFormProps, ImportTypes } from './import-types';
import ImportStrategySection from './ImportStrategySection';
import { BuildSection } from './section/BuildSection';

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
  const gitRepositoryUrl = searchParams.get('git.repository');
  const gitRevision = searchParams.get('git.revision');
  const gitContextDir = searchParams.get('git.contextDir');
  const formType = searchParams.get('formType');
  const importType = searchParams.get('importType');
  const {
    git: { validated, gitType },
    build: { option: buildOption },
  } = values;

  const showFullForm =
    importType === ImportTypes.devfile ||
    (validated !== ValidatedOptions.default && gitType !== GitProvider.INVALID);

  const isSample = hasSampleQueryParameter();
  const showAdvancedSections =
    importType !== ImportTypes.devfile &&
    values.import.selectedStrategy.type !== ImportStrategy.DEVFILE &&
    !isSample;

  return (
    <form onSubmit={handleSubmit} data-test-id="import-git-form">
      <Flex direction={{ default: 'column', sm: 'row' }}>
        <FlexItem flex={{ default: 'flex_1' }} alignSelf={{ default: 'alignSelfFlexStart' }}>
          <FormBody>
            <GitSection
              builderImages={builderImages}
              defaultSample={
                gitRepositoryUrl && {
                  url: gitRepositoryUrl,
                  ref: gitRevision,
                  dir: gitContextDir,
                }
              }
              formType={formType}
              importType={importType}
            />
            {showFullForm && (
              <>
                {importType === ImportTypes.devfile ? (
                  <DevfileStrategySection />
                ) : (
                  <ImportStrategySection builderImages={builderImages} />
                )}
                <AppSection
                  project={values.project}
                  noProjectsAvailable={projects.loaded && _.isEmpty(projects.data)}
                />
                {formType !== 'sample' && importType !== ImportTypes.devfile && (
                  <BuildSection values={values} />
                )}
                {showAdvancedSections && (
                  <>
                    {buildOption === BuildOptions.PIPELINES && (
                      <PipelineSection builderImages={builderImages} />
                    )}
                    {buildOption !== BuildOptions.DISABLED && <DeploySection values={values} />}

                    <AdvancedSection values={values} />
                  </>
                )}
              </>
            )}
          </FormBody>
        </FlexItem>
      </Flex>
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
