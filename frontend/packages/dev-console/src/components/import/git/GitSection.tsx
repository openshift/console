import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField, DropdownField } from '../../formik-fields';
import { GitTypes } from '../import-types';
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
  const tag = values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);

  const handleGitUrlBlur: React.ReactEventHandler<HTMLInputElement> = React.useCallback(() => {
    const gitType = detectGitType(values.git.url);
    const gitRepoName = detectGitRepoName(values.git.url);
    const showGitType = gitType === '';
    setFieldValue('git.type', gitType);
    setFieldValue('git.showGitType', showGitType);
    gitRepoName && !values.name && setFieldValue('name', gitRepoName);
    setFieldTouched('git.url', true);
    setFieldTouched('git.type', showGitType);
    validateForm();
  }, [setFieldTouched, setFieldValue, validateForm, values.git.url, values.name]);

  const fillSample: React.ReactEventHandler<HTMLButtonElement> = React.useCallback(() => {
    const url = sampleRepo;
    const ref = getSampleRef(tag);
    const dir = getSampleContextDir(tag);
    const name = values.name || values.image.selected;
    values.name !== name && setFieldValue('name', name);
    setFieldValue('git.url', url);
    setFieldValue('git.dir', dir);
    setFieldValue('git.ref', ref);
    validateForm();
  }, [sampleRepo, setFieldValue, tag, validateForm, values.image.selected, values.name]);

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
        <DropdownField
          name="git.type"
          label="Git Type"
          items={GitTypes}
          title={GitTypes[values.git.type]}
          fullWidth
          required
        />
      )}
      {sampleRepo && <SampleRepo onClick={fillSample} />}
      <AdvancedGitOptions />
    </FormSection>
  );
};

export default GitSection;
