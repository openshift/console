import * as React from 'react';
import { TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { CubeIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { getGitService, ImportStrategy } from '@console/git-service/src';
import { InputField } from '@console/shared';
import FormSection from '../section/FormSection';

const DockerSection: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    import: { showEditImportStrategy, strategies, selectedStrategy },
    git: { url, type, ref, dir, secretResource },
    docker,
    formType,
  } = values;
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  const handleDockerfileChange = React.useCallback(async () => {
    const gitService = getGitService(
      url,
      type,
      ref,
      dir,
      secretResource,
      null,
      docker.dockerfilePath,
    );
    const isDockerFilePresent = gitService && (await gitService.isDockerfilePresent());
    if (isDockerFilePresent) {
      setValidated(ValidatedOptions.success);
      setFieldValue('docker.dockerfileHasError', false);
    } else {
      setValidated(ValidatedOptions.error);
      setFieldValue('docker.dockerfileHasError', true);
    }
  }, [dir, docker.dockerfilePath, ref, secretResource, setFieldValue, type, url]);

  const helpText = React.useMemo(() => {
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.error) {
      return t('devconsole~Dockerfile not detected');
    }
    return t(
      'devconsole~Allows the builds to use a different path to locate your Dockerfile, relative to the Context Dir field.',
    );
  }, [t, validated]);

  React.useEffect(() => {
    if (selectedStrategy.type === ImportStrategy.DOCKERFILE) {
      strategies.forEach((s) => {
        if (s.type === ImportStrategy.DOCKERFILE) {
          setFieldValue('import.selectedStrategy.detectedFiles', s.detectedFiles);
          setFieldValue('docker.dockerfilePath', s.detectedFiles[0]);
          handleDockerfileChange();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStrategy.type, setFieldValue, strategies]);

  return (
    <FormSection>
      {showEditImportStrategy && (
        <InputField
          type={TextInputTypes.text}
          name="docker.dockerfilePath"
          label={t('devconsole~Dockerfile path')}
          helpText={helpText}
          helpTextInvalid={helpText}
          validated={validated}
          onBlur={handleDockerfileChange}
          required
        />
      )}
      {formType !== 'edit' && (
        <div className="co-catalog-item-details">
          <CubeIcon size="xl" />
          &nbsp;
          <div>
            <h2 className="co-section-heading co-catalog-item-details__name">
              {t('devconsole~Dockerfile')}
            </h2>
          </div>
        </div>
      )}
    </FormSection>
  );
};

export default DockerSection;
