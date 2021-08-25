import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { getGitService } from '@console/git-service/src';
import { InputField } from '@console/shared/src';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import FormSection from '../section/FormSection';
import { useDevfileServer, useDevfileSource, useSelectedDevfileSample } from './devfileHooks';
import DevfileInfo from './DevfileInfo';

const DevfileStrategySection: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    git: { url, type, ref, dir, secretResource },
    devfile,
  } = values;
  const [, devfileParseError] = useDevfileServer(values, setFieldValue);
  useDevfileSource();
  const selectedSample = useSelectedDevfileSample();
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  const devfileInfo = React.useMemo(() => {
    let info;
    if (values.devfile?.devfileContent) {
      const devfileJSON = safeYAMLToJS(values.devfile.devfileContent);
      info = {
        displayName: devfileJSON.metadata?.name || 'Devfile',
        tags: devfileJSON.metadata?.version ? [devfileJSON.metadata.version] : [],
        iconClass: devfileJSON.metadata?.name ? `icon-${devfileJSON.metadata?.name}` : '',
      };
    }
    if (selectedSample) info = selectedSample;
    return info;
  }, [selectedSample, values.devfile]);

  const handleDevfileChange = React.useCallback(async () => {
    const gitService = getGitService(url, type, ref, dir, secretResource, devfile.devfilePath);
    if (!values.devfile?.devfileSourceUrl) {
      // No need to check the existence of the file, waste of a call to the gitService for this need
      const devfileContents = gitService && (await gitService.getDevfileContent());
      if (!devfileContents) {
        setFieldValue('docker.dockerfilePath', 'Dockerfile');
        setFieldValue('devfile.devfileContent', null);
        setFieldValue('devfile.devfileHasError', true);
        setValidated(ValidatedOptions.error);
      } else {
        setFieldValue('docker.dockerfilePath', 'Dockerfile');
        setFieldValue('devfile.devfileContent', devfileContents);
        setFieldValue('devfile.devfileHasError', false);
        setValidated(ValidatedOptions.success);
      }
    }
  }, [devfile.devfilePath, dir, ref, secretResource, setFieldValue, type, url, values.devfile]);

  const helpText = React.useMemo(() => {
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.error) {
      return t('devconsole~Devfile not detected');
    }
    return t(
      'devconsole~Allows the builds to use a different path to locate your Devfile, relative to the Context Dir field',
    );
  }, [t, validated]);

  React.useEffect(() => {
    handleDevfileChange();
    // We need to run only one when component mounts and then onBlur will take care of it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {devfileParseError && (
        <Alert isInline variant="danger" title={t('devconsole~Import is not possible.')}>
          {devfileParseError}
        </Alert>
      )}
      {values.import.showEditImportStrategy && (
        <FormSection>
          <InputField
            type={TextInputTypes.text}
            name="devfile.devfilePath"
            label={t('devconsole~Devfile Path')}
            helpText={helpText}
            helpTextInvalid={helpText}
            validated={validated}
            onBlur={handleDevfileChange}
            required
          />
        </FormSection>
      )}
      {devfileInfo && <DevfileInfo devfileSample={devfileInfo} />}
    </>
  );
};

export default DevfileStrategySection;
