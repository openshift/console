import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { useFormikContext, FormikErrors, FormikTouched } from 'formik';
import { isEmpty } from 'lodash';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { RepoStatus, ImportStrategy, getGitService, GitProvider } from '@console/git-service';
import { DetectedBuildType } from '@console/git-service/src/utils/build-tool-type-detector';
import { detectImportStrategies } from '@console/git-service/src/utils/import-strategy-detector';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { BuildStrategyType } from '@console/internal/components/build';
import {
  FLAG_KNATIVE_SERVING_SERVICE,
  ServerlessBuildStrategyType,
  ServiceModel as ksvcModel,
} from '@console/knative-plugin';
import { InputField, useFormikValidationFix, useDebounceCallback, useFlag } from '@console/shared';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { isGitImportSource } from '../../../types/samples';
import {
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
  NormalizedBuilderImages,
} from '../../../utils/imagestream-utils';
import { getSample, getGitImportSample } from '../../../utils/samples';
import { GitData, DetectedStrategyFormData } from '../import-types';
import { detectGitRepoName, detectGitType } from '../import-validation-utils';
import FormSection from '../section/FormSection';
import AdvancedGitOptions from './AdvancedGitOptions';
import GitTypeSelector from './GitTypeSelector';
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
    devfileContent?: string;
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
  import?: {
    recommendedStrategy?: DetectedStrategyFormData;
  };
};

export interface GitSectionProps {
  title?: React.ReactNode;
  formContextField?: string;
  builderImages?: NormalizedBuilderImages;
  defaultSample?: { url: string; ref?: string; dir?: string };
  showSample?: boolean;
  formType?: string;
  importType?: string;
  imageStreamName?: string;
}

const GitSection: React.FC<GitSectionProps> = ({
  title,
  formContextField,
  builderImages,
  defaultSample,
  showSample = !!defaultSample,
  formType,
  importType,
  imageStreamName,
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

  const isKnativeServingAvailable = useFlag(FLAG_KNATIVE_SERVING_SERVICE);
  const [canCreateKnativeService, canCreateKnativeServiceLoading] = useAccessReview({
    group: ksvcModel.apiGroup,
    resource: ksvcModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

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
  const formReloadCount: number = _.get(formikValues, 'formReloadCount');

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
  const imageStreamTag = isEmpty(values.image.tagObj) ? defaultSampleTagObj : values.image.tagObj;
  const imageStreamTagSampleRepo = showSample && getSampleRepo(imageStreamTag);
  const {
    name: nameTouched,
    application: { name: applicationNameTouched } = {},
    image: { selected: imageSelectorTouched } = {},
    git: { dir: gitDirTouched, type: gitTypeTouched } = {},
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

  const handleDevfileStrategyDetection = React.useCallback(
    async (devfilePath: string, gitType: GitProvider) => {
      if (gitUrlError) {
        setFieldValue('devfile.devfileContent', null);
        setFieldValue('devfile.devfileHasError', true);
        return;
      }
      if (importType !== 'devfile' && !values.devfile?.devfileSourceUrl) {
        setFieldValue('devfile.devfilePath', devfilePath);
        setFieldValue('docker.dockerfilePath', 'Dockerfile');
        const gitService = getGitService(
          values.git.url,
          gitType,
          values.git.ref,
          values.git.dir,
          values.git.secretResource,
          devfilePath,
        );
        const devfileContents = gitService && (await gitService.getDevfileContent());
        if (!devfileContents) {
          setFieldValue('devfile.devfileContent', null);
          setFieldValue('devfile.devfileHasError', true);
        } else {
          setFieldValue('devfile.devfileContent', devfileContents);
          setFieldValue('devfile.devfileHasError', false);
        }
      }
    },
    [
      gitUrlError,
      importType,
      setFieldValue,
      values.devfile,
      values.git.dir,
      values.git.ref,
      values.git.secretResource,
      values.git.url,
    ],
  );

  const handleGitUrlChange = React.useCallback(
    async (url: string, ref: string, dir: string) => {
      if (isKnativeServingAvailable && canCreateKnativeServiceLoading) return;
      if (isSubmitting || status?.submitError) return;
      setValidated(ValidatedOptions.default);
      setFieldValue('git.validated', ValidatedOptions.default);
      setFieldValue('git.isUrlValidating', true);
      if (gitUrlError) {
        // Reset git type field when url is not valid or empty so that when new url valid is added, we run git type detection again.
        // Don't do anything else if URL is not valid.
        setFieldValue('git.showGitType', false);
        setFieldTouched('git.type', false);
        setFieldValue('git.isUrlValidating', false);
        return;
      }
      const detectedGitType = detectGitType(url);
      const isUnsureDetectedGitType = detectedGitType === GitProvider.UNSURE;
      const gitRepoName = formType !== 'sample' && detectGitRepoName(url);

      // Updated detectedType only
      if (detectedGitType !== values.git.detectedType) {
        setFieldValue('git.detectedType', detectedGitType);
      }
      if (isUnsureDetectedGitType && !values.git.showGitType) {
        setFieldValue('git.showGitType', true);
      }

      if (!isUnsureDetectedGitType && values.git.showGitType) {
        setFieldValue('git.showGitType', false);
      }

      const gitType =
        isUnsureDetectedGitType && values.git.showGitType ? values.git.type : detectedGitType;

      if (gitType !== values.git.type) {
        setFieldTouched('git.type', false, false);
        setFieldValue('git.type', gitType);
      }

      const gitService = getGitService(
        url,
        gitType,
        ref,
        dir,
        values.git.secretResource,
        values.devfile?.devfilePath,
        values.docker?.dockerfilePath,
      );

      const importStrategyData = await detectImportStrategies(
        url,
        gitService,
        isKnativeServingAvailable && canCreateKnativeService,
      );

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
            name: 'Builder Image',
            type: ImportStrategy.S2I,
            priority: 0,
            detectedFiles: [],
          },
          recommendedStrategy: null,
          showEditImportStrategy: true,
        });
        setFieldValue('build.strategy', BuildStrategyType.Source);
        return;
      }

      gitRepoName && !nameTouched && !values.name && setFieldValue('name', gitRepoName);
      gitRepoName &&
        values.formType !== 'edit' &&
        !values.application.name &&
        values.application.selectedKey !== UNASSIGNED_KEY &&
        setFieldValue('application.name', `${gitRepoName}-app`);

      if (importType === 'devfile' || imageStreamName || values.formType === 'edit') {
        setValidated(ValidatedOptions.success);
        setFieldValue('git.validated', ValidatedOptions.success);
        setFieldValue('git.isUrlValidating', false);
        importType === 'devfile' && setFieldValue('build.strategy', BuildStrategyType.Devfile);
        importType === 'devfile' &&
          !values.devfile?.devfileContent &&
          setFieldValue('import.recommendedStrategy', importStrategies[0]);
        values.formType === 'edit' &&
          values.build.strategy === BuildStrategyType.Source &&
          handleBuilderImageRecommendation(
            importStrategies?.find((s) => s.type === ImportStrategy.S2I)?.detectedCustomData,
          );
        return;
      }

      setFieldValue('import.loaded', loaded);
      setFieldValue('import.loadError', loadError);
      setFieldValue('import.strategies', importStrategies);
      if (importStrategies.length > 0) {
        setFieldValue('import.showEditImportStrategy', false);
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
        setFieldValue('import.showEditImportStrategy', true);
      }
      setFieldValue('import.strategyChanged', false);

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
            handleDevfileStrategyDetection(importStrategies[0].detectedFiles[0], gitType);
            break;
          }
          case ImportStrategy.DOCKERFILE: {
            setFieldValue('build.strategy', BuildStrategyType.Docker);
            setFieldValue('docker.dockerfilePath', importStrategies[0].detectedFiles[0]);
            setFieldValue('docker.dockerfileHasError', false);
            break;
          }
          case ImportStrategy.SERVERLESS_FUNCTION: {
            setFieldValue('build.strategy', ServerlessBuildStrategyType.ServerlessFunction);
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
      formType,
      values.git.detectedType,
      values.git.showGitType,
      values.git.type,
      values.git.secretResource,
      values.devfile,
      values.docker,
      values.name,
      values.formType,
      values.application.name,
      values.application.selectedKey,
      values.build.strategy,
      isKnativeServingAvailable,
      canCreateKnativeService,
      canCreateKnativeServiceLoading,
      nameTouched,
      importType,
      imageStreamName,
      setFieldTouched,
      handleBuilderImageRecommendation,
      builderImages,
      handleDevfileStrategyDetection,
    ],
  );

  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange);

  const fillImageStreamTagSample = React.useCallback(() => {
    if (isKnativeServingAvailable && canCreateKnativeServiceLoading) return;
    const url = imageStreamTagSampleRepo;
    const ref = getSampleRef(imageStreamTag);
    const dir = getSampleContextDir(imageStreamTag);
    setFieldValue('git.url', imageStreamTagSampleRepo, false);
    setFieldValue('git.ref', ref, false);
    setFieldValue('git.dir', dir, false);
    setFieldTouched('git.url', true, true);
    debouncedHandleGitUrlChange(url, ref, dir);
  }, [
    debouncedHandleGitUrlChange,
    imageStreamTagSampleRepo,
    setFieldTouched,
    setFieldValue,
    imageStreamTag,
    isKnativeServingAvailable,
    canCreateKnativeServiceLoading,
  ]);

  React.useEffect(() => {
    (!dirty || gitDirTouched || gitTypeTouched || formReloadCount || values.git.secretResource) &&
      values.git.url &&
      debouncedHandleGitUrlChange(values.git.url, values.git.ref, values.git.dir);
  }, [
    dirty,
    isSubmitting,
    gitDirTouched,
    formReloadCount,
    debouncedHandleGitUrlChange,
    values.git.url,
    values.git.ref,
    values.git.dir,
    values.git.type,
    values.git.secretResource,
    gitTypeTouched,
  ]);

  const helpText = React.useMemo(() => {
    if (values.git.isUrlValidating) {
      return `${t('devconsole~Validating')}...`;
    }
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.warning) {
      switch (repoStatus) {
        case RepoStatus.RateLimitExceeded: {
          return t('devconsole~Rate limit exceeded');
        }
        case RepoStatus.GitTypeNotDetected: {
          return t(
            'devconsole~URL is valid but a git type could not be identified. Please select a git type from the options below',
          );
        }
        case RepoStatus.PrivateRepo: {
          return t(
            'devconsole~If this is a private repository, enter a source Secret in advanced Git options',
          );
        }
        case RepoStatus.ResourceNotFound: {
          return t('devconsole~Requested repository does not exist');
        }
        case RepoStatus.InvalidGitTypeSelected: {
          return t(
            'devconsole~The selected git type might not be valid or the repository is private. Please try selecting another git type or enter a source Secret in advanced Git options',
          );
        }
        /* Special case for Gitea as it throws 404 for all kinds of negatives */
        case RepoStatus.GiteaRepoUnreachable: {
          return t(
            'devconsole~The Gitea repository is unreachable. The repository might be private or does not exist',
          );
        }
        default: {
          return t('devconsole~URL is valid but cannot be reached');
        }
      }
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

  /**
   * Automatically focus the git repository field and prefill it with different
   * sample types.
   *
   * 1. ConsoleSample
   * 2. ImageStream samples
   */
  React.useEffect(() => {
    // Skip handling until Knative Service status is unknown!
    if (canCreateKnativeServiceLoading) return;

    inputRef.current?.focus();

    const { sampleName, repository: sampleRepository } = getGitImportSample();
    if (sampleRepository?.url) {
      const name = detectGitRepoName(sampleRepository.url);
      setFieldValue('name', name, false);
      setFieldValue('application.name', `${name}-app`, false);
      setFieldValue('git.url', sampleRepository.url, false);
      if (sampleRepository.revision) {
        setFieldValue('git.ref', sampleRepository.revision, false);
      }
      if (sampleRepository.contextDir) {
        setFieldValue('git.dir', sampleRepository.contextDir, false);
      }
      setFieldTouched('git.url', true, true);
      debouncedHandleGitUrlChange(
        sampleRepository.url,
        sampleRepository.revision,
        sampleRepository.contextDir,
      );
    }
    if (sampleName) {
      getSample(sampleName)
        .then((sample) => {
          if (isGitImportSource(sample.spec.source)) {
            const { gitImport } = sample.spec.source;
            if (!sampleRepository?.url) {
              const name = detectGitRepoName(sampleRepository.url);
              setFieldValue('name', name, false);
              setFieldValue('application.name', `${name}-app`, false);
              setFieldValue('git.url', gitImport.repository.url, false);
              if (sampleRepository.revision) {
                setFieldValue('git.ref', sampleRepository.revision, false);
              }
              if (sampleRepository.contextDir) {
                setFieldValue('git.dir', sampleRepository.contextDir, false);
              }
              setFieldTouched('git.url', true, true);
              debouncedHandleGitUrlChange(
                gitImport.repository.url,
                gitImport.repository.revision,
                gitImport.repository.contextDir,
              );
            }
            if (gitImport?.service?.targetPort && gitImport?.service?.targetPort !== 8080) {
              setFieldValue(
                'route.unknownTargetPort',
                gitImport.service.targetPort.toString(),
                false,
              );
            }
            // handleSearch(containerImport.image);
          } else {
            // eslint-disable-next-line no-console
            console.error(
              `Unsupported ConsoleSample "${sampleName}" source type ${sample.spec?.source?.type}`,
            );
          }
        })
        .catch((error) => {
          // eslint-disable-next-line no-console
          console.error(`Error while loading ConsoleSample "${sampleName}":`, error);
        });
    } else if (formType === 'sample' && imageStreamTagSampleRepo) {
      fillImageStreamTagSample();
    }

    // Disable deps to load the samples only once when the component is loaded.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCreateKnativeServiceLoading]);

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
        onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
          const trimmedURL = e.target.value.trim();
          if (e.target.value !== trimmedURL) {
            setFieldValue('git.url', trimmedURL);
            debouncedHandleGitUrlChange(trimmedURL, values.git.ref, values.git.dir);
          }
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          resetFields();
          debouncedHandleGitUrlChange(e.target.value.trim(), values.git.ref, values.git.dir);
        }}
        data-test-id="git-form-input-url"
        required
        isDisabled={formType === 'sample' && imageStreamTagSampleRepo}
      />
      {formType !== 'sample' && imageStreamTagSampleRepo && (
        <SampleRepo onClick={fillImageStreamTagSample} />
      )}
      {values.git.showGitType && (
        <>
          <GitTypeSelector fieldPrefix={fieldPrefix} />
          {values.git.type === GitProvider.UNSURE && (
            <Alert isInline variant="info" title={t('devconsole~Defaulting Git type to other')}>
              {t('devconsole~We failed to detect the Git type.')}
            </Alert>
          )}
        </>
      )}
      {formType !== 'sample' && <AdvancedGitOptions formContextField={formContextField} />}
    </FormSection>
  );
};

export default GitSection;
