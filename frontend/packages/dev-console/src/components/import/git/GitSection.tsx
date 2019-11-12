import * as React from 'react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { Alert, TextInputTypes } from '@patternfly/react-core';
import { getGitService, GitProvider } from '@console/git-service';
import { LoadingInline } from '@console/internal/components/utils';
import { CheckCircleIcon } from '@patternfly/react-icons';
import { InputField, DropdownField } from '../../formik-fields';
import { GitReadableTypes, GitTypes } from '../import-types';
import { detectGitType, detectGitRepoName } from '../import-validation-utils';
import { getSampleRepo, getSampleRef, getSampleContextDir } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import AdvancedGitOptions from './AdvancedGitOptions';

export interface GitSectionProps {
  showSample?: boolean;
}

const GitSection: React.FC<GitSectionProps> = ({ showSample }) => {
  const { values, setFieldValue, setFieldTouched, setFieldError, validateForm } = useFormikContext<
    FormikValues
  >();
  const [, { touched: gitTypeTouched }] = useField('git.type');
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
    gitRepoName && !values.name && setFieldValue('name', gitRepoName);
    gitRepoName &&
      !values.application.name &&
      setFieldValue('application.name', `${gitRepoName}-app`);
    setFieldTouched('git.url', true);
    showGitType && setFieldTouched('git.type', false);

    const gitService = getGitService({ url, ref }, gitType as GitProvider);
    const isReachable = gitService && (await gitService.isRepoReachable());
    setFieldValue('git.isUrlValidating', false);
    if (isReachable) {
      setFieldValue('git.isUrlValidated', true);
      setFieldValue('image.isRecommending', true);
      const buildTools = await gitService.detectBuildType();
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
      setFieldValue('git.isUrlValidated', false);
      setFieldError('git.url', 'Git respository is not reachable.');
    }

    validateForm();
  }, [
    setFieldError,
    setFieldTouched,
    setFieldValue,
    validateForm,
    values.application.name,
    values.git,
    values.name,
  ]);

  const handleGitUrlChange: React.ReactEventHandler = React.useCallback(() => {
    setFieldValue('git.isUrlValidated', false);
    values.image.recommended && setFieldValue('image.recommended', '');
    values.image.couldNotRecommend && setFieldValue('image.couldNotRecommend', false);
  }, [setFieldValue, values.image.couldNotRecommend, values.image.recommended]);

  const fillSample: React.ReactEventHandler<HTMLButtonElement> = React.useCallback(() => {
    const url = sampleRepo;
    const ref = getSampleRef(tag);
    const dir = getSampleContextDir(tag);
    const gitType = detectGitType(url);
    const name = values.name || values.image.selected;
    values.name !== name && setFieldValue('name', name);
    !values.application.name && setFieldValue('application.name', `${name}-app`);
    setFieldValue('git.url', url);
    setFieldValue('git.dir', dir);
    setFieldValue('git.ref', ref);
    setFieldValue('git.type', gitType);
    setFieldTouched('git.url', true);
    validateForm();
  }, [
    sampleRepo,
    setFieldTouched,
    setFieldValue,
    tag,
    validateForm,
    values.application.name,
    values.image.selected,
    values.name,
  ]);

  const getHelpText = () => {
    if (values.git.isUrlValidating) {
      return (
        <span style={{ fontWeight: 'bold' }}>
          <LoadingInline /> Validating...
        </span>
      );
    }
    if (values.git.isUrlValidated) {
      return (
        <span style={{ fontWeight: 'bold', color: 'var(--pf-global--success-color--200)' }}>
          <CheckCircleIcon /> Validated
        </span>
      );
    }
    return '';
  };

  return (
    <FormSection title="Git">
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label="Git Repo URL"
        helpText={getHelpText()}
        onChange={handleGitUrlChange}
        onBlur={handleGitUrlBlur}
        required
      />
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
      {sampleRepo && <SampleRepo onClick={fillSample} />}
      <AdvancedGitOptions />
    </FormSection>
  );
};

export default GitSection;
