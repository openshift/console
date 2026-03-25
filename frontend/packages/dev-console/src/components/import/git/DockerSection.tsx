import type { FC } from 'react';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { Icon, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { CubeIcon } from '@patternfly/react-icons/dist/esm/icons/cube-icon';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { DockerFileParser, getGitService, ImportStrategy } from '@console/git-service/src';
import { InputField } from '@console/shared';
import SecondaryHeading from '@console/shared/src/components/heading/SecondaryHeading';
import type { GitImportFormData } from '../import-types';
import FormSection from '../section/FormSection';

const DockerSection: FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched } = useFormikContext<
    FormikValues & GitImportFormData
  >();
  const {
    import: { showEditImportStrategy, strategies, recommendedStrategy },
    git: { url, type, ref, dir, secretResource },
    image: { ports },
    docker,
    formType,
  } = values;
  const [validated, setValidated] = useState<ValidatedOptions>(ValidatedOptions.default);

  const handleDockerfileChange = useCallback(async () => {
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

  const helpText = useMemo(() => {
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

  useEffect(() => {
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

  useEffect(() => {
    const gitService =
      url && getGitService(url, type, ref, dir, secretResource, null, docker.dockerfilePath);
    gitService &&
      gitService.getDockerfileContent().then((dockerfileContent) => {
        if (dockerfileContent) {
          const parser = new DockerFileParser(dockerfileContent);
          const port = parser.getContainerPort();
          port &&
            setFieldValue('image.ports', [...ports, { containerPort: port, protocol: 'TCP' }]);
        }
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docker.dockerfilePath, url]);

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
          <Icon size="xl">
            <CubeIcon />
          </Icon>
          &nbsp;
          <div>
            <SecondaryHeading className="co-catalog-item-details__name">
              {t('devconsole~Dockerfile')}
            </SecondaryHeading>
          </div>
        </div>
      )}
    </FormSection>
  );
};

export default DockerSection;
