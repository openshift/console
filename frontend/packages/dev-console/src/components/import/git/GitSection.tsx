import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { isEmpty } from 'lodash';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { RepoStatus, ImportStrategy, getGitService } from '@console/git-service';
import { DetectedBuildType } from '@console/git-service/src/utils/build-tool-type-detector';
import { detectImportStrategies } from '@console/git-service/src/utils/import-strategy-detector';
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
import { detectGitRepoName, detectGitType } from '../import-validation-utils';
import FormSection from '../section/FormSection';
import AdvancedGitOptions from './AdvancedGitOptions';
import SampleRepo from './SampleRepo';

export type GitSectionFormData = {
  formType: string;
  name: string;
  application: {
    selected: string;
    selectedKey: string;
    name: string;
    isInContext: any;
  };
  image: {
    selected: any;
    selectedKey: string;
    tagObj: string;
    recommended: string;
    couldNotRecommend: boolean;
  };
  git: GitData;
  devfile?: {
    devfilePath: string;
    devfileSourceUrl: string;
  };
  docker?: {
    dockerfilePath: string;
  };
  build: {
    strategy: BuildStrategyType;
  };
  project: {
    name: string;
  };
};

export interface GitSectionProps {
  title?: React.ReactNode;
  formContextField?: string;
  builderImages?: NormalizedBuilderImages;
  defaultSample?: { url: string; ref?: string; dir?: string };
  showSample?: boolean;
  formType?: string;
}

const GitSection: React.FC<GitSectionProps> = ({
  title,
  formContextField,
  builderImages,
  defaultSample,
  showSample = !!defaultSample,
  formType,
}) => {
  const { t } = useTranslation();
  const inputRef = React.useRef<HTMLInputElement>();

  const {
    dirty,
    isSubmitting,
    values: formikValues,
    touched: formikTouched,
    errors: formikErrors,
    status,
    setFieldValue: formikSetFieldValue,
    setFieldTouched: formikSetFieldTouched,
  } = useFormikContext<GitSectionFormData>();

  const fieldPrefix = formContextField ? `${formContextField}.` : '';
  const setFieldValue = React.useCallback(
    (key: string, value: string | boolean | object, shouldValidate?: boolean) => {
      formikSetFieldValue(`${fieldPrefix}${key}` as any, value, shouldValidate);
    },
    [fieldPrefix, formikSetFieldValue],
  );
  const setFieldTouched = React.useCallback(
    (key: string, touched: boolean, shouldValidate?: boolean) => {
      formikSetFieldTouched(`${fieldPrefix}${key}` as any, touched, shouldValidate);
    },
    [fieldPrefix, formikSetFieldTouched],
  );

  const values: GitSectionFormData = formContextField
    ? _.get(formikValues, formContextField)
    : formikValues;
  const touched: FormikTouched<GitSectionFormData> = formContextField
    ? _.get(formikTouched, formContextField, {})
    : formikTouched;
  const errors: FormikErrors<GitSectionFormData> = formContextField
    ? _.get(formikErrors, formContextField, {})
    : formikErrors;

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
  const {
    name: nameTouched,
    application: { name: applicationNameTouched } = {},
    image: { selected: imageSelectorTouched } = {},
    git: { dir: gitDirTouched } = {},
  } = touched;
  const { git: { url: gitUrlError } = {} } = errors;

  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const [repoStatus, setRepoStatus] = React.useState<RepoStatus>();

  const handleBuilderImageRecommendation = React.useCallback(
    async (detectedBuildTypes: DetectedBuildType[]) => {
      setFieldValue('image.isRecommending', false);
      if (gitUrlError) {
        setFieldValue('image.recommended', '');
        setFieldValue('image.couldNotRecommend', true);
        return;
      }
      const recommendedBuildType =
        builderImages &&
        detectedBuildTypes?.find(
          ({ type: recommended }) => recommended && builderImages.hasOwnProperty(recommended),
        );
      if (recommendedBuildType && recommendedBuildType.type) {
        setFieldValue('image.couldNotRecommend', false);
        setFieldValue('image.recommended', recommendedBuildType.type);
      } else {
        setFieldValue('image.couldNotRecommend', true);
        setFieldValue('image.recommended', '');
      }
    },
    [builderImages, gitUrlError, setFieldValue],
  );

  const handleDevfileStrategyDetection = React.useCallback(async () => {
    const gitService = getGitService(
      values.git.url,
      // TODO: ODC-6250 - GitTypes is not compatibily to git service type GitProvider
      values.git.type as any,
      values.git.ref,
      values.git.dir,
      values.git.secretResource,
      values.devfile?.devfilePath,
      values.docker?.dockerfilePath,
    );
    if (!values.devfile?.devfilePath || !values.devfile?.devfileSourceUrl) {
      // No need to check the existence of the file, waste of a call to the gitService for this need
      const devfileContents = gitService && (await gitService.getDevfileContent());
      if (!devfileContents) {
        setFieldValue('devfile.devfileContent', null);
        setFieldValue('devfile.devfileHasError', true);
      } else {
        setFieldValue('devfile.devfileContent', devfileContents);
        setFieldValue('devfile.devfileHasError', false);
      }
    }
  }, [
    setFieldValue,
    values.devfile,
    values.docker,
    values.git.dir,
    values.git.ref,
    values.git.secretResource,
    values.git.type,
    values.git.url,
  ]);

  const handleGitUrlChange = React.useCallback(
    async (url: string, ref: string, dir: string) => {
      if (isSubmitting || status?.submitError) return;
      setValidated(ValidatedOptions.default);
      setFieldValue('git.validated', ValidatedOptions.default);
      if (gitUrlError) {
        // Reset git type field when url is not valid or empty so that when new url valid is added, we run git type detection again.
        // Don't do anything else if URL is not valid.
        setFieldValue('git.showGitType', false);
        setFieldTouched('git.type', false);
        return;
      }

      setFieldValue('git.isUrlValidating', true);

      const detectedGitType = detectGitType(url);
      const gitType = values.git.showGitType ? values.git.type : detectedGitType;
      const gitRepoName = detectGitRepoName(url);

      // Updated detectedType only
      if (detectedGitType !== values.git.detectedType) {
        setFieldValue('git.detectedType', gitType);
      }
      if (detectedGitType === GitTypes.unsure && !values.git.showGitType) {
        setFieldValue('git.showGitType', true);
      }
      if (gitType !== values.git.type) {
        setFieldValue('git.type', gitType);
      }

      const gitService = getGitService(
        url,
        // TODO: ODC-6250 - GitTypes is not compatibily to git service type GitProvider
        gitType as any,
        ref,
        dir,
        values.git.secretResource,
        values.devfile?.devfilePath,
        values.docker?.dockerfilePath,
      );

      const importStrategyData = await detectImportStrategies(url, gitService);

      const {
        loaded,
        loadError,
        repositoryStatus,
        strategies: importStrategies,
      } = importStrategyData;

      setRepoStatus(repositoryStatus);

      if (repositoryStatus !== RepoStatus.Reachable) {
        setValidated(ValidatedOptions.warning);
        setFieldValue('git.validated', ValidatedOptions.warning);
        setFieldValue('git.isUrlValidating', false);
        setFieldValue('import', {
          loaded: false,
          loadError: null,
          strategies: [],
          selectedStrategy: {
            name: 'Devfile',
            type: ImportStrategy.DEVFILE,
            priority: 2,
            detectedFiles: [],
          },
          recommendedStrategy: null,
          showEditImportStrategy: true,
        });
        return;
      }

      gitRepoName && !nameTouched && !values.name && setFieldValue('name', gitRepoName);
      gitRepoName &&
        values.formType !== 'edit' &&
        !values.application.name &&
        values.application.selectedKey !== UNASSIGNED_KEY &&
        setFieldValue('application.name', `${gitRepoName}-app`);

      setFieldValue('import.loaded', loaded);
      setFieldValue('import.loadError', loadError);
      setFieldValue('import.strategies', importStrategies);
      if (importStrategies.length > 0) {
        values.formType !== 'edit' && setFieldValue('import.showEditImportStrategy', false);
        setFieldValue('import.selectedStrategy', importStrategies[0]);
        setFieldValue('import.recommendedStrategy', importStrategies[0]);
      } else {
        setFieldValue('import.selectedStrategy', {
          name: 'Devfile',
          type: ImportStrategy.DEVFILE,
          priority: 2,
          detectedFiles: [],
        });
        setFieldValue('import.recommendedStrategy', null);
        values.formType !== 'edit' && setFieldValue('import.showEditImportStrategy', true);
      }

      if (importStrategies.length > 0) {
        switch (importStrategies[0].type) {
          case ImportStrategy.S2I: {
            setFieldValue('build.strategy', BuildStrategyType.Source);
            if (builderImages) {
              setFieldValue('image.isRecommending', true);
              handleBuilderImageRecommendation(importStrategies[0].detectedCustomData);
            }
            break;
          }
          case ImportStrategy.DEVFILE: {
            setFieldValue('build.strategy', BuildStrategyType.Devfile);
            setFieldValue('devfile.devfilePath', importStrategies[0].detectedFiles[0]);
            setFieldValue('docker.dockerfilePath', 'Dockerfile');
            handleDevfileStrategyDetection();
            break;
          }
          case ImportStrategy.DOCKERFILE: {
            setFieldValue('build.strategy', BuildStrategyType.Docker);
            setFieldValue('docker.dockerfilePath', importStrategies[0].detectedFiles[0]);
            break;
          }
          default:
        }
      }

      setValidated(ValidatedOptions.success);
      setFieldValue('git.validated', ValidatedOptions.success);
      setFieldValue('git.isUrlValidating', false);
    },
    [
      isSubmitting,
      status,
      setFieldValue,
      gitUrlError,
      values.git.showGitType,
      values.git.type,
      values.git.detectedType,
      values.git.secretResource,
      values.devfile,
      values.docker,
      values.name,
      values.formType,
      values.application.name,
      values.application.selectedKey,
      nameTouched,
      setFieldTouched,
      builderImages,
      handleBuilderImageRecommendation,
      handleDevfileStrategyDetection,
    ],
  );

  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange);

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
    (!dirty || gitDirTouched) &&
      values.git.url &&
      debouncedHandleGitUrlChange(values.git.url, values.git.ref, values.git.dir);
  }, [
    dirty,
    isSubmitting,
    gitDirTouched,
    debouncedHandleGitUrlChange,
    values.git.url,
    values.git.ref,
    values.git.dir,
  ]);

  const helpText = React.useMemo(() => {
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
    return t('devconsole~Repository URL to build and deploy your code from');
  }, [t, values.git.isUrlValidating, validated, repoStatus]);

  const resetFields = React.useCallback(() => {
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
  }, [
    setFieldValue,
    values.formType,
    values.image.recommended,
    values.image.couldNotRecommend,
    values.application.selectedKey,
    values.application.isInContext,
    applicationNameTouched,
    imageSelectorTouched,
    nameTouched,
  ]);

  useFormikValidationFix(values.git.url);

  React.useEffect(() => {
    inputRef.current?.focus();
    sampleRepo && fillSample(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <FormSection title={title ?? t('devconsole~Git')}>
      <InputField
        ref={inputRef}
        type={TextInputTypes.text}
        name={`${fieldPrefix}git.url`}
        label={t('devconsole~Git Repo URL')}
        helpText={helpText}
        helpTextInvalid={helpText}
        validated={validated}
        onChange={(e: React.SyntheticEvent) => {
          resetFields();
          debouncedHandleGitUrlChange(
            (e.target as HTMLInputElement).value,
            values.git.ref,
            values.git.dir,
          );
        }}
        data-test-id="git-form-input-url"
        required
        isDisabled={formType === 'sample' && sampleRepo}
      />
      {formType !== 'sample' && sampleRepo && <SampleRepo onClick={fillSample} />}
      {values.git.showGitType && (
        <>
          <DropdownField
            name={`${fieldPrefix}git.type`}
            label={t('devconsole~Git type')}
            items={GitReadableTypes}
            title={GitReadableTypes[values.git.type]}
            fullWidth
            required
          />
          {values.git.detectedType === GitTypes.unsure && (
            <Alert isInline variant="info" title={t('devconsole~Defaulting Git type to other')}>
              {t('devconsole~We failed to detect the Git type.')}
            </Alert>
          )}
        </>
      )}
      <AdvancedGitOptions formContextField={formContextField} />
    </FormSection>
  );
};

export default GitSection;
