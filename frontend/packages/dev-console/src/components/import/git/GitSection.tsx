import * as React from 'react';
import { useFormikContext, FormikValues, FormikTouched } from 'formik';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { getGitService, GitProvider, BuildType } from '@console/git-service';
import {
  InputField,
  DropdownField,
  useFormikValidationFix,
  useDebounceCallback,
} from '@console/shared';
import { GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import { DevfileParser } from '@console/git-service/src/utils/devfile-parser';
import {
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
  NormalizedBuilderImages,
} from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import AdvancedGitOptions from './AdvancedGitOptions';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '../../../const';

export interface GitSectionProps {
  showSample?: boolean;
  buildStrategy? : string
  builderImages: NormalizedBuilderImages;
}

const GitSection: React.FC<GitSectionProps> = ({ showSample, buildStrategy, builderImages }) => {
  const { values, setFieldValue, setFieldTouched, touched, dirty } = useFormikContext<
    FormikValues
  >();
  const tag = values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);
  const { application = {}, name: nameTouched, git = {}, image = {} } = touched;
  const { type: gitTypeTouched } = git as FormikTouched<{ type: boolean }>;
  const { name: applicationNameTouched } = application as FormikTouched<{ name: boolean }>;
  const { selected: imageSelectorTouched } = image as FormikTouched<{ selected: boolean }>;
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  const handleGitUrlChange = React.useCallback(
    async (url: string, ref: string) => {
      setFieldValue('git.isUrlValidating', true);
      setValidated(ValidatedOptions.default);

      const gitType = gitTypeTouched ? values.git.type : detectGitType(url);
      const gitRepoName = detectGitRepoName(url);
      const showGitType = gitType === GitTypes.unsure || gitTypeTouched;

      setFieldValue('git.type', gitType);
      setFieldValue('git.showGitType', showGitType);
      showGitType && setFieldTouched('git.type', false);
      
      const gitService = getGitService({ url, ref }, gitType as GitProvider);
      const isReachable = gitService && (await gitService.isRepoReachable());
      const isDevfilePresent = gitService && (await gitService.isDevfilePresent());
      const DevfileContents = gitService && (await gitService.getDevfileContent());
      const devfileParser = new DevfileParser(DevfileContents);
      
      setFieldValue('git.isUrlValidating', false);
      
      if (buildStrategy === 'Devfile' ) {
        if (isReachable && isDevfilePresent){
          const DevfileVersion = await devfileParser.getDevfileVersion(DevfileContents)
          const semver = require('semver')
          if (semver.gte(DevfileVersion, '2.1.0')) {
            gitRepoName && !values.name && setFieldValue('name', gitRepoName);
            gitRepoName &&
            !values.application.name &&
            values.application.selectedKey !== UNASSIGNED_KEY &&
            setFieldValue('application.name', `${gitRepoName}-app`);
            setFieldValue('devfile.devfilePath', `${url}/devfile.yaml`)
            setFieldValue('devfile.devfileContent', DevfileContents)
            setValidated(ValidatedOptions.success);
          }
          else {
            setValidated(ValidatedOptions.warning);
          }
        }
        else if (isReachable && !isDevfilePresent){
          setValidated(ValidatedOptions.warning);
        }
        else {
          setValidated(ValidatedOptions.error);
        }
      }
      else if (isReachable) {
        setValidated(ValidatedOptions.success);
        gitRepoName && !values.name && setFieldValue('name', gitRepoName);
        gitRepoName &&
          !values.application.name &&
          values.application.selectedKey !== UNASSIGNED_KEY &&
          setFieldValue('application.name', `${gitRepoName}-app`);
        if (builderImages) {
          setFieldValue('image.isRecommending', true);
          const buildTools: BuildType[] = await gitService.detectBuildTypes();
          setFieldValue('image.isRecommending', false);
          const buildTool = buildTools.find(
            ({ buildType: recommended }) =>
              recommended && builderImages.hasOwnProperty(recommended),
          );
          if (buildTool && buildTool.buildType) {
            setFieldValue('image.couldNotRecommend', false);
            setFieldValue('image.recommended', buildTool.buildType);
          } else {
            setFieldValue('image.couldNotRecommend', true);
            setFieldValue('image.recommended', '');
          }
        }
      } else {
        setFieldValue('image.recommended', '');
        setFieldValue('image.couldNotRecommend', false);
        setValidated(ValidatedOptions.warning);
      }
    },
    [
      builderImages,
      gitTypeTouched,
      setFieldTouched,
      setFieldValue,
      values.application.name,
      values.application.selectedKey,
      values.git.type,
      values.name,
    ],
  );

  const debouncedHandleGitUrlChange = useDebounceCallback(handleGitUrlChange, [handleGitUrlChange]);

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
    const gitType = detectGitType(url);
    const name = values.name || values.image.selected;
    values.name !== name && setFieldValue('name', name);
    !values.application.name &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      setFieldValue('application.name', `${name}-app`);
    setFieldValue('git.url', url);
    setFieldValue('git.dir', dir);
    setFieldValue('git.ref', ref);
    setFieldValue('git.type', gitType);
    setFieldTouched('git.url', true);
  }, [
    sampleRepo,
    setFieldTouched,
    setFieldValue,
    tag,
    values.application.name,
    values.application.selectedKey,
    values.image.selected,
    values.name,
  ]);

  React.useEffect(() => {
    const { url, ref } = values.git;
    (!dirty || gitTypeTouched) && values.git.url && handleGitUrlChange(url, ref);
  }, [dirty, gitTypeTouched, handleGitUrlChange, values.git]);

  const getHelpText = () => {
    if (values.git.isUrlValidating) {
      return 'Validating...';
    }

    if (validated === ValidatedOptions.success) {
      return 'Validated';
    }
    if (validated === ValidatedOptions.warning) {
      return 'URL is valid but cannot be reached. If this is a private repository, enter a source secret in Advanced Git Options';
    }
    if (validated === ValidatedOptions.warning) {
      return 'Valid URL but devfile build guidance not available.';
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
    <FormSection title="Git">
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label="Git Repo URL"
        helpText={getHelpText()}
        helpTextInvalid={getHelpText()}
        validated={validated}
        onChange={(e: React.SyntheticEvent) => {
          resetFields();
          setValidated(ValidatedOptions.default);
          debouncedHandleGitUrlChange((e.target as HTMLInputElement).value, values.git.ref);
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
            label="Git Type"
            items={GitReadableTypes}
            title={GitReadableTypes[values.git.type]}
            fullWidth
            required
          />
          {!gitTypeTouched && values.git.type === GitTypes.unsure && (
            <Alert isInline variant="info" title="Defaulting Git Type to Other">
              We failed to detect the Git type.
            </Alert>
          )}
        </>
      )}
      <AdvancedGitOptions />
    </FormSection>
  );
};

export default GitSection;
