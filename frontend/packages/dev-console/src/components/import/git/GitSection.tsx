import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { useFormikContext, FormikValues, FormikTouched, FormikErrors } from 'formik';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import { getGitService, GitProvider, BuildType, RepoStatus } from '@console/git-service';
import { BuildStrategyType } from '@console/internal/components/build';
import {
  InputField,
  DropdownField,
  useFormikValidationFix,
  useDebounceCallback,
} from '@console/shared';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import {
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
  NormalizedBuilderImages,
} from '../../../utils/imagestream-utils';
import { GitData, GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import FormSection from '../section/FormSection';
import AdvancedGitOptions from './AdvancedGitOptions';
import SampleRepo from './SampleRepo';

export interface GitSectionProps {
  buildStrategy: BuildStrategyType;
  builderImages: NormalizedBuilderImages;
  defaultSample?: { url: string; ref?: string; dir?: string };
  showSample?: boolean;
}

const GitSection: React.FC<GitSectionProps> = ({
  buildStrategy,
  builderImages,
  defaultSample,
  showSample = !!defaultSample,
}) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>();
  const {
    values,
    errors,
    setFieldValue,
    setFieldTouched,
    touched,
    dirty,
    isSubmitting,
  } = useFormikContext<FormikValues>();
  const { url: defaultSampleURL, dir: defaultSampleDir, ref: defaultSampleRef } =
    defaultSample || {};
  const defaultSampleTagObj = React.useMemo(
    () =>
      defaultSampleURL
        ? {
            annotations: {
              sampleRepo: defaultSampleURL,
              sampleContextDir: defaultSampleDir ?? './',
              sampleRef: defaultSampleRef ?? '',
            },
          }
        : null,
    [defaultSampleURL, defaultSampleDir, defaultSampleRef],
  );
  const tag = isEmpty(values.image.tagObj) ? defaultSampleTagObj : values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);
  const { application = {}, name: nameTouched, git = {}, image = {} } = touched;
  const { url: gitUrlTouched } = git as FormikTouched<{ url: boolean }>;
  const { type: gitTypeTouched } = git as FormikTouched<{ type: boolean }>;
  const { dir: gitDirTouched } = git as FormikTouched<{ dir: boolean }>;
  const { name: applicationNameTouched } = application as FormikTouched<{ name: boolean }>;
  const { selected: imageSelectorTouched } = image as FormikTouched<{ selected: boolean }>;
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [repoStatus, setRepoStatus] = React.useState<RepoStatus>();

  const { git: gitErrors = {} } = errors;
  const { url: gitUrlError } = gitErrors as FormikErrors<GitData>;

  const handleGitUrlChange = React.useCallback(
    async (url: string, ref: string, dir: string) => {
      if (gitUrlError) {
        // Reset git type field when url is not valid or empty so that when new url valid is added, we run git type detection again.
        // Don't do anything else if URL is not valid.
        setFieldTouched('git.type', false);
        return;
      }

      setFieldValue('git.isUrlValidating', true);
      setValidated(ValidatedOptions.default);

      const gitType = gitTypeTouched ? values.git.type : detectGitType(url);
      const gitRepoName = detectGitRepoName(url);
      const showGitType = gitType === GitTypes.unsure || (gitTypeTouched && !isSubmitting);

      setFieldValue('git.type', gitType);
      setFieldValue('git.showGitType', showGitType);

      const gitService = getGitService({ url, ref, contextDir: dir }, gitType as GitProvider);
      const repositoryStatus = gitService && (await gitService.isRepoReachable());

      setRepoStatus(repositoryStatus);

      if (repositoryStatus !== RepoStatus.Reachable) {
        setValidated(ValidatedOptions.warning);
        setFieldValue('git.isUrlValidating', false);
        return;
      }

      gitRepoName && !nameTouched && !values.name && setFieldValue('name', gitRepoName);
      gitRepoName &&
        values.formType !== 'edit' &&
        !values.application.name &&
        values.application.selectedKey !== UNASSIGNED_KEY &&
        setFieldValue('application.name', `${gitRepoName}-app`);

      if (buildStrategy === BuildStrategyType.Devfile && !values.devfile?.devfileSourceUrl) {
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

      setFieldValue('git.isUrlValidating', false);
    },
    [
      setFieldValue,
      setFieldTouched,
      gitTypeTouched,
      buildStrategy,
      gitUrlError,
      nameTouched,
      isSubmitting,
      values.application.name,
      values.application.selectedKey,
      values.formType,
      values.git.type,
      values.name,
      values.devfile,
    ],
  );

  const handleBuilderImageRecommendation = React.useCallback(async () => {
    const gitType = gitTypeTouched ? values.git.type : detectGitType(values.git.url);
    const gitService = getGitService(
      { url: values.git.url, ref: values.git.ref, contextDir: values.git.dir },
      gitType as GitProvider,
    );
    if (repoStatus === RepoStatus.Reachable && builderImages) {
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
    repoStatus,
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
    values.formType !== 'edit' && gitRepoName && !nameTouched && setFieldValue('name', gitRepoName);
    gitRepoName &&
      values.formType !== 'edit' &&
      !values.application.name &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      setFieldValue('application.name', `${gitRepoName}-app`);
    setFieldTouched('git.url', true);
  }, [
    values.git,
    values.formType,
    values.application.name,
    values.application.selectedKey,
    nameTouched,
    setFieldValue,
    setFieldTouched,
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
    (!dirty || gitUrlTouched || gitTypeTouched || gitDirTouched) &&
      values.git.url &&
      debouncedHandleGitUrlChange(values.git.url, values.git.ref, values.git.dir);
  }, [
    dirty,
    gitUrlTouched,
    gitTypeTouched,
    gitDirTouched,
    debouncedHandleGitUrlChange,
    values.git.url,
    values.git.ref,
    values.git.dir,
  ]);

  const getHelpText = () => {
    if (values.git.isUrlValidating) {
      return `${t('devconsole~Validating')}...`;
    }
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.warning) {
      if (repoStatus === RepoStatus.RateLimitExceeded) {
        return t('devconsole~Rate limit exceeded');
      }
      return t(
        'devconsole~URL is valid but cannot be reached. If this is a private repository, enter a source Secret in advanced Git options',
      );
    }
    if (validated === ValidatedOptions.error && buildStrategy === BuildStrategyType.Devfile) {
      return t('devconsole~No Devfile present, unable to continue.');
    }
    if (buildStrategy === BuildStrategyType.Source) {
      return t('devconsole~Repository URL to build and deploy your code from source.');
    }
    if (buildStrategy === BuildStrategyType.Docker) {
      return t('devconsole~Repository URL to build and deploy your code from a Dockerfile.');
    }
    if (buildStrategy === BuildStrategyType.Devfile) {
      return t('devconsole~Repository URL to build and deploy your code from a Devfile.');
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

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <FormSection title={t('devconsole~Git')}>
      <InputField
        ref={inputRef}
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
