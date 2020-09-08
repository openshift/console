import * as React from 'react';
import { useFormikContext, FormikValues, FormikTouched } from 'formik';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { getGitService, GitProvider } from '@console/git-service';
import {
  InputField,
  DropdownField,
  useFormikValidationFix,
  useDebounceCallback,
} from '@console/shared';
import { GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import { getSampleRepo, getSampleRef, getSampleContextDir } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import AdvancedGitOptions from './AdvancedGitOptions';
import { UNASSIGNED_KEY, CREATE_APPLICATION_KEY } from '../../../const';

export interface GitSectionProps {
  showSample?: boolean;
  buildStrategy? : string
}

const GitSection: React.FC<GitSectionProps> = ({ showSample, buildStrategy }) => {
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
      const getDevfile = gitService && (await gitService.getDevfileContent());
      setFieldValue('git.isUrlValidating', false);
      // do something extra if Devfile is present? What should it do?
      // is there a way we can detect if the build strategy type is for devfiles here?
      // if it isn't doing anything extra here then delete this if statement, 
      // because otherwise it will be useless if it isn't checking the build strategy
      if (buildStrategy === "Devfile" ) {
        if (isReachable && isDevfilePresent){
          gitRepoName && !values.name && setFieldValue('name', gitRepoName);
          gitRepoName &&
            !values.application.name &&
            values.application.selectedKey !== UNASSIGNED_KEY &&
            setFieldValue('application.name', `${gitRepoName}-app`);
          console.log(getDevfile);
        }
        else if (isReachable && !isDevfilePresent){
          console.log("*************Repo is reachable but devfile not present**********************");
        }
      }
      else if (isReachable) {
        setValidated(ValidatedOptions.success);
        gitRepoName && !values.name && setFieldValue('name', gitRepoName);
        gitRepoName &&
          !values.application.name &&
          values.application.selectedKey !== UNASSIGNED_KEY &&
          setFieldValue('application.name', `${gitRepoName}-app`);
        setFieldValue('image.isRecommending', true);
        const buildTools = await gitService.detectBuildTypes();
        setFieldValue('image.isRecommending', false);
        if (buildTools.length > 0) {
          const buildTool = buildTools[0].buildType;
          setFieldValue('image.couldNotRecommend', false);
          setFieldValue('image.recommended', buildTool);
        } else {
          setFieldValue('image.couldNotRecommend', true);
          setFieldValue('image.recommended', '');
        }
      } else {
        setFieldValue('image.recommended', '');
        setFieldValue('image.couldNotRecommend', false);
        setValidated(ValidatedOptions.error);
      }
    },
    [
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
    gitRepoName && setFieldValue('name', gitRepoName);
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
    if (validated === ValidatedOptions.error) {
      return 'Git repository is not reachable.';
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
              We failed to detect the git type.
            </Alert>
          )}
        </>
      )}
      <AdvancedGitOptions />
    </FormSection>
  );
};

export default GitSection;
