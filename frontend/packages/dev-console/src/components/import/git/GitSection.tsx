import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import { ExpandCollapse } from '@console/internal/components/utils';
import { InputField, DropdownField } from '../../formik-fields';
import { GitTypes, ProjectData } from '../import-types';
import { detectGitType } from '../import-validation-utils';
import { getSampleRepo, getSampleRef, getSampleContextDir } from '../../../utils/imagestream-utils';
import FormSection from '../section/FormSection';
import SampleRepo from './SampleRepo';
import SourceSecretSelector from './SourceSecretSelector';

export interface GitSectionProps {
  project: ProjectData;
  showSample?: boolean;
}

const GitSection: React.FC<GitSectionProps> = ({ project, showSample }) => {
  const { values, setFieldValue, setFieldTouched, validateForm } = useFormikContext<FormikValues>();
  const tag = values.image.tagObj;
  const sampleRepo = showSample && getSampleRepo(tag);

  const handleGitUrlBlur: React.ReactEventHandler<HTMLInputElement> = React.useCallback(() => {
    const gitType = detectGitType(values.git.url);
    const showGitType = gitType === '';
    setFieldValue('git.type', gitType);
    setFieldValue('git.showGitType', showGitType);
    setFieldTouched('git.url', true);
    setFieldTouched('git.type', showGitType);
    validateForm();
  }, [setFieldTouched, setFieldValue, validateForm, values.git.url]);

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
    <FormSection title="Git" divider>
      <InputField
        type="text"
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
          selectedKey={values.git.type}
          title={GitTypes[values.git.type]}
          fullWidth
          required
        />
      )}
      {sampleRepo && <SampleRepo onClick={fillSample} />}
      <ExpandCollapse
        textExpanded="Hide Advanced Git Options"
        textCollapsed="Show Advanced Git Options"
      >
        <InputField
          type="text"
          name="git.ref"
          label="Git Reference"
          helpText="Optional branch, tag, or commit."
        />
        <InputField
          type="text"
          name="git.dir"
          label="Context Dir"
          helpText="Optional subdirectory for the application source code, used as a context directory for build."
        />
        <SourceSecretSelector
          namespace={project.name}
          helpText="Secret with credentials for pulling your source code."
        />
      </ExpandCollapse>
      {values.build.strategy === 'Docker' && (
        <React.Fragment>
          <InputField
            type="text"
            name="docker.dockerfilePath"
            label="Dockerfile Path"
            helpText="Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field."
          />
          <InputField
            type="number"
            name="docker.containerPort"
            label="Container Port"
            helpText="Port number the container exposes"
          />
        </React.Fragment>
      )}
    </FormSection>
  );
};

export default GitSection;
