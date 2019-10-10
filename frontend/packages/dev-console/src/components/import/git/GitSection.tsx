import * as React from 'react';
import { useFormikContext, FormikValues, useField } from 'formik';
import { Alert, TextInputTypes } from '@patternfly/react-core';
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
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const [, { touched: gitTypeTouched }] = useField('git.type');
  const tag = values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);

  const handleGitUrlBlur: React.ReactEventHandler<HTMLInputElement> = React.useCallback(() => {
    const gitType = detectGitType(values.git.url);
    const gitRepoName = detectGitRepoName(values.git.url);
    const showGitType = gitType === GitTypes.unsure;
    setFieldValue('git.type', gitType);
    setFieldValue('git.showGitType', showGitType);
    gitRepoName && !values.name && setFieldValue('name', gitRepoName);
    gitRepoName &&
      !values.application.name &&
      setFieldValue('application.name', `${gitRepoName}-app`);
    setFieldTouched('git.url', true);
    showGitType && setFieldTouched('git.type', false);
    validateForm();
  }, [
    setFieldTouched,
    setFieldValue,
    validateForm,
    values.application.name,
    values.git.url,
    values.name,
  ]);

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

  return (
    <FormSection title="Git">
      <InputField
        type={TextInputTypes.text}
        name="git.url"
        label="Git Repo URL"
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
