import * as React from 'react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { getGitService, GitProvider } from '@console/git-service';
import { InputField, DropdownField, useFormikValidationFix } from '@console/shared';
import { GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import { getSampleRepo, getSampleRef, getSampleContextDir } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import AdvancedGitOptions from './AdvancedGitOptions';
import { UNASSIGNED_KEY } from '../../../const';

export interface GitSectionProps {
  showSample?: boolean;
}

const GitSection: React.FC<GitSectionProps> = ({ showSample }) => {
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const [, { touched: gitTypeTouched }] = useField('git.type');
  const [, { touched: userSelection }] = useField('image.selected');
  const tag = values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);

  const handleGitUrlBlur: React.ReactEventHandler = React.useCallback(async () => {
    const { url, ref } = values.git;

    setFieldValue('git.isUrlValidating', true);

    const gitType = detectGitType(url);
    const gitRepoName = detectGitRepoName(url);
    const showGitType = gitType === GitTypes.unsure;

    setFieldValue('git.type', gitType);
    setFieldValue('git.showGitType', showGitType);
    if (gitRepoName && !values.name) {
      setFieldValue('name', gitRepoName);
      setFieldTouched('name', true);
    }
    gitRepoName &&
      !values.application.name &&
      values.application.selectedKey !== UNASSIGNED_KEY &&
      setFieldValue('application.name', `${gitRepoName}-app`);
    setFieldTouched('git.url', true);
    showGitType && setFieldTouched('git.type', false);

    const gitService = getGitService({ url, ref }, gitType as GitProvider);
    const isReachable = gitService && (await gitService.isRepoReachable());
    setFieldValue('git.isUrlValidating', false);
    if (isReachable) {
      setFieldValue('git.urlValidation', ValidatedOptions.success);
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
      setFieldValue('git.urlValidation', ValidatedOptions.error);
    }
  }, [
    setFieldTouched,
    setFieldValue,
    values.application.name,
    values.application.selectedKey,
    values.git,
    values.name,
  ]);

  const handleGitUrlChange: React.ReactEventHandler = React.useCallback(() => {
    setFieldValue('git.urlValidation', ValidatedOptions.default);
    if (!userSelection) {
      setFieldValue('image.selected', '');
      setFieldValue('image.tag', '');
    }
    values.image.recommended && setFieldValue('image.recommended', '');
    values.image.couldNotRecommend && setFieldValue('image.couldNotRecommend', false);
  }, [setFieldValue, values.image.couldNotRecommend, values.image.recommended, userSelection]);

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

  const getHelpText = () => {
    if (values.git.isUrlValidating) {
      return 'Validating...';
    }
    if (values.git.urlValidation === ValidatedOptions.success) {
      return 'Validated';
    }
    return '';
  };

  useFormikValidationFix(values.git.url);

  return (
    <FormSection title="Git">
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label="Git Repo URL"
        helpText={getHelpText()}
        helpTextInvalid="Git repository is not reachable."
        validated={values.git.urlValidation}
        onChange={handleGitUrlChange}
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
          {!gitTypeTouched && (
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
