import * as React from 'react';
import { TextInputTypes } from '@patternfly/react-core';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { getGitService, ImportStrategy } from '@console/git-service/src';
import { detectImportStrategies } from '@console/git-service/src/utils/import-strategy-detector';
import { FormHeader, InputField, useDebounceCallback } from '@console/shared';
import { useBuilderImages } from '../hooks/useBuilderImages';
import {
  recommendRepositoryName,
  detectGitType,
  getPipelineRunTemplate,
} from '../repository-form-utils';
import { RepositoryFormValues } from '../types';
import AdvancedConfigurations from './AdvancedConfigurations';

const RepositoryFormSection = () => {
  const { t } = useTranslation();
  const templatesRef = React.useRef({});
  const { setFieldValue } = useFormikContext<RepositoryFormValues>();

  const [builderImages] = useBuilderImages();
  const handleGitUrlChange = async (url) => {
    if (!url) {
      return;
    }
    const detectedGitType = detectGitType(url);
    const recommendedRepoName = recommendRepositoryName(url);
    if (recommendedRepoName) {
      setFieldValue('name', recommendedRepoName);
    }
    detectedGitType && setFieldValue('gitProvider', detectedGitType);
    const gitService = getGitService(url, detectedGitType);

    const importStrategyData = await detectImportStrategies(url, gitService);
    if (importStrategyData.strategies.length > 0) {
      const detectedBuildTypes = importStrategyData.strategies?.find(
        (s) => s.type === ImportStrategy.S2I,
      )?.detectedCustomData;

      const recommendedBuildType =
        builderImages &&
        detectedBuildTypes?.find(
          ({ type: recommended }) => recommended && builderImages.hasOwnProperty(recommended),
        );

      const template: string = templatesRef.current[recommendedBuildType?.type]
        ? templatesRef.current[recommendedBuildType?.type]
        : await getPipelineRunTemplate(recommendedBuildType?.type, recommendedRepoName);
      if (template) {
        templatesRef.current[recommendedBuildType?.type] = template;
        setFieldValue('yamlData', template);
      }
    }
  };
  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange);

  return (
    <>
      <FormHeader title={t('pipelines-plugin~Add Git Repository')} />
      <FormSection>
        <InputField
          label={t('pipelines-plugin~Git Repo URL')}
          name="gitUrl"
          type={TextInputTypes.text}
          required
          onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
            const trimmedURL = e.target.value.trim();
            if (e.target.value !== trimmedURL) {
              debouncedHandleGitUrlChange(trimmedURL, '', '');
            }
          }}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedHandleGitUrlChange(e.target.value.trim(), '', '');
          }}
        />
        <InputField
          label={t('pipelines-plugin~Name')}
          name="name"
          type={TextInputTypes.text}
          required
        />
        <AdvancedConfigurations />
      </FormSection>
    </>
  );
};

export default RepositoryFormSection;
