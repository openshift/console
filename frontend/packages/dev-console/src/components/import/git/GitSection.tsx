import * as React from 'react';
import { isEmpty } from 'lodash';
import { useFormikContext, FormikValues, FormikTouched } from 'formik';
import { useTranslation } from 'react-i18next';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { getGitService, GitProvider, BuildType } from '@console/git-service';
import {
  InputField,
  DropdownField,
  useFormikValidationFix,
  useDebounceCallback,
} from '@console/shared';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { BuildStrategyType } from '@console/internal/components/build';
import { GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import {
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
  NormalizedBuilderImages,
} from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import AdvancedGitOptions from './AdvancedGitOptions';

export interface GitSectionProps {
  defaultSample?: { url: string; ref?: string; dir?: string };
  showSample?: boolean;
  buildStrategy?: string;
  builderImages: NormalizedBuilderImages;
}

const GitSection: React.FC<GitSectionProps> = ({
  defaultSample,
  showSample = !!defaultSample,
  buildStrategy,
  builderImages,
}) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched, touched, dirty } = useFormikContext<
    FormikValues
  >();
  const { url: defaultSampleURL, dir: defaultSampleDir, ref: defaultSampleRef } =
    defaultSample || {};
  const defaultSampleTagObj = React.useMemo(
    () =>
      defaultSampleURL
        ? {
            annotations: {
              sampleRepo: defaultSampleURL,
              sampleContextDir: defaultSampleDir ?? './',
              sampleRef: defaultSampleRef ?? 'master',
            },
          }
        : null,
    [defaultSampleURL, defaultSampleDir, defaultSampleRef],
  );
  const tag = isEmpty(values.image.tagObj) ? defaultSampleTagObj : values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);
  const { application = {}, name: nameTouched, git = {}, image = {} } = touched;
  const { type: gitTypeTouched } = git as FormikTouched<{ type: boolean }>;
  const { name: applicationNameTouched } = application as FormikTouched<{ name: boolean }>;
  const { selected: imageSelectorTouched } = image as FormikTouched<{ selected: boolean }>;
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [isRepoReachable, setIsRepoReachable] = React.useState<boolean>(false);

  const handleGitUrlChange = React.useCallback(
    async (url: string, ref: string, dir: string) => {
      setFieldValue('git.isUrlValidating', true);
      setValidated(ValidatedOptions.default);

      const gitType = gitTypeTouched ? values.git.type : detectGitType(url);
      const gitRepoName = detectGitRepoName(url);
      const showGitType = gitType === GitTypes.unsure || gitTypeTouched;

      setFieldValue('git.type', gitType);
      setFieldValue('git.showGitType', showGitType);
      showGitType && setFieldTouched('git.type', false);

      const gitService = getGitService({ url, ref, contextDir: dir }, gitType as GitProvider);
      const isReachable = gitService && (await gitService.isRepoReachable());

      setIsRepoReachable(isReachable);
      setFieldValue('git.isUrlValidating', false);

      if (!isReachable) {
        setValidated(ValidatedOptions.warning);
        return;
      }

      gitRepoName && !values.name && setFieldValue('name', gitRepoName);
      gitRepoName &&
        !values.application.name &&
        values.application.selectedKey !== UNASSIGNED_KEY &&
        setFieldValue('application.name', `${gitRepoName}-app`);

      if (buildStrategy === 'Devfile') {
        // No need to check the existence of the file, waste of a call to the gitService for this need
        const devfileContents = gitService && (await gitService.getDevfileContent());
        if (!devfileContents) {
          setFieldValue('devfile.devfileContent', null);
          setFieldValue('devfile.devfileHasError', true);
          setValidated(ValidatedOptions.error);
        } else {
          setFieldValue('devfile.devfileContent', devfileContents);
          setFieldValue('devfile.devfileHasError', false);
          setValidated(ValidatedOptions.success);
        }
      } else {
        setValidated(ValidatedOptions.success);
      }
    },
    [
      buildStrategy,
      gitTypeTouched,
      setFieldTouched,
      setFieldValue,
      values.application.name,
      values.application.selectedKey,
      values.git.type,
      values.name,
    ],
  );

  const handleBuilderImageRecommendation = React.useCallback(async () => {
    const gitType = gitTypeTouched ? values.git.type : detectGitType(values.git.url);
    const gitService = getGitService(
      { url: values.git.url, ref: values.git.ref, contextDir: values.git.dir },
      gitType as GitProvider,
    );
    if (isRepoReachable && builderImages) {
      setFieldValue('image.isRecommending', true);
      const buildTools: BuildType[] = gitService && (await gitService.detectBuildTypes());
      setFieldValue('image.isRecommending', false);
      const buildTool = buildTools?.find(
        ({ buildType: recommended }) => recommended && builderImages.hasOwnProperty(recommended),
      );
      if (buildTool && buildTool.buildType) {
        setFieldValue('image.couldNotRecommend', false);
        setFieldValue('image.recommended', buildTool.buildType);
      } else {
        setFieldValue('image.couldNotRecommend', true);
        setFieldValue('image.recommended', '');
      }
    } else {
      setFieldValue('image.recommended', '');
      setFieldValue('image.couldNotRecommend', false);
    }
  }, [
    builderImages,
    gitTypeTouched,
    isRepoReachable,
    setFieldValue,
    values.git.ref,
    values.git.type,
    values.git.url,
    values.git.dir,
  ]);

  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange);

  const handleGitUrlBlur = React.useCallback(() => {
    const { url } = values.git;
    const gitRepoName = detectGitRepoName(url);
    values.formType !== 'edit' && gitRepoName && setFieldValue('name', gitRepoName);
    gitRepoName &&
      !values.application.name &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      setFieldValue('application.name', `${gitRepoName}-app`);
    setFieldTouched('git.url', true);
  }, [
    setFieldTouched,
    setFieldValue,
    values.application.name,
    values.application.selectedKey,
    values.git,
    values.formType,
  ]);

  const fillSample: React.ReactEventHandler<HTMLButtonElement> = React.useCallback(() => {
    const url = sampleRepo;
    const ref = getSampleRef(tag);
    const dir = getSampleContextDir(tag);
    setFieldValue('git.url', url);
    setFieldValue('git.dir', dir);
    setFieldValue('git.ref', ref);
    setFieldTouched('git.url', true);
    handleGitUrlChange(url, ref, dir);
  }, [handleGitUrlChange, sampleRepo, setFieldTouched, setFieldValue, tag]);

  React.useEffect(() => {
    values.build.strategy === BuildStrategyType.Source &&
      values.git.url &&
      handleBuilderImageRecommendation();
  }, [handleBuilderImageRecommendation, values.build.strategy, values.git.url]);

  React.useEffect(() => {
    const { url, ref, dir } = values.git;
    (!dirty || gitTypeTouched) && values.git.url && handleGitUrlChange(url, ref, dir);
  }, [dirty, gitTypeTouched, handleGitUrlChange, values.git]);

  const getHelpText = () => {
    if (values.git.isUrlValidating) {
      return `${t('devconsole~Validating')}...`;
    }
    if (buildStrategy === 'Devfile' && validated === ValidatedOptions.error) {
      return t('devconsole~No Devfile present, unable to continue');
    }
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.warning) {
      return t(
        'devconsole~URL is valid but cannot be reached. If this is a private repository, enter a source Secret in advanced Git options',
      );
    }
    return '';
  };

  const resetFields = () => {
    if (!imageSelectorTouched) {
      setFieldValue('image.selected', '');
      setFieldValue('image.tag', '');
    }
    values.image.recommended && setFieldValue('image.recommended', '');
    values.image.couldNotRecommend && setFieldValue('image.couldNotRecommend', false);
    if (values.formType === 'edit') {
      values.application.selectedKey !== UNASSIGNED_KEY &&
        values.application.selectedKey === CREATE_APPLICATION_KEY &&
        !applicationNameTouched &&
        setFieldValue('application.name', '');
      return;
    }
    !nameTouched && setFieldValue('name', '');
    !values.application.isInContext &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      !applicationNameTouched &&
      setFieldValue('application.name', '');
  };

  useFormikValidationFix(values.git.url);
  return (
    <FormSection title={t('devconsole~Git')}>
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label={t('devconsole~Git Repo URL')}
        helpText={getHelpText()}
        helpTextInvalid={getHelpText()}
        validated={validated}
        onChange={(e: React.SyntheticEvent) => {
          resetFields();
          setValidated(ValidatedOptions.default);
          debouncedHandleGitUrlChange(
            (e.target as HTMLInputElement).value,
            values.git.ref,
            values.git.dir,
          );
        }}
        onBlur={handleGitUrlBlur}
        data-test-id="git-form-input-url"
        required
      />
      {sampleRepo && <SampleRepo onClick={fillSample} />}
      {values.git.showGitType && (
        <>
          <DropdownField
            name="git.type"
            label={t('devconsole~Git type')}
            items={GitReadableTypes}
            title={GitReadableTypes[values.git.type]}
            fullWidth
            required
          />
          {!gitTypeTouched && values.git.type === GitTypes.unsure && (
            <Alert isInline variant="info" title={t('devconsole~Defaulting Git type to other')}>
              {t('devconsole~We failed to detect the Git type.')}
            </Alert>
          )}
        </>
      )}
      <AdvancedGitOptions />
    </FormSection>
  );
};

export default GitSection;
