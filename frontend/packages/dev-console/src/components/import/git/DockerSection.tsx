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
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const {
    import: { showEditImportStrategy, strategies, recommendedStrategy },
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
    if (docker.dockerfilePath && isDockerFilePresent) {
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
    if (recommendedStrategy && recommendedStrategy.type !== ImportStrategy.DOCKERFILE) {
      const dockerfileStrategy = strategies.find((s) => s.type === ImportStrategy.DOCKERFILE);
      if (dockerfileStrategy) {
        setFieldValue('import.selectedStrategy.detectedFiles', dockerfileStrategy.detectedFiles);
        setFieldValue('docker.dockerfilePath', dockerfileStrategy.detectedFiles?.[0]);
        handleDockerfileChange();
        validated === ValidatedOptions.success
          ? setFieldValue('import.strategyChanged', true)
          : setFieldValue('import.strategyChanged', false);
      }
      setFieldTouched('docker.dockerfilePath', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedStrategy, setFieldValue, strategies]);

  return (
    <FormSection>
      {showEditImportStrategy && (
        <InputField
          type={TextInputTypes.text}
          name="docker.dockerfilePath"
          label={t('devconsole~Dockerfile path')}
          placeholder={t('devconsole~Enter Dockerfile path')}
          helpText={helpText}
          helpTextInvalid={helpText}
          validated={validated}
          onBlur={() => {
            handleDockerfileChange();
            validated === ValidatedOptions.success
              ? setFieldValue('import.strategyChanged', true)
              : setFieldValue('import.strategyChanged', false);
          }}
          required
        />
      )}
      {formType !== 'edit' && !docker.dockerfileHasError && (
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
