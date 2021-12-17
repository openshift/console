import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { getGitService, ImportStrategy } from '@console/git-service/src';
import { InputField } from '@console/shared/src';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import FormSection from '../section/FormSection';
import { useDevfileServer, useDevfileSource, useSelectedDevfileSample } from './devfileHooks';
import DevfileInfo from './DevfileInfo';
import './DevfileStrategySection.scss';

const DevfileStrategySection: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const {
    import: { showEditImportStrategy, strategies, recommendedStrategy },
    git: { url, type, ref, dir, secretResource },
    devfile,
  } = values;
  const [, devfileParseError] = useDevfileServer(values, setFieldValue);
  useDevfileSource();
  const selectedSample = useSelectedDevfileSample();
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);
  const searchParams = new URLSearchParams(window.location.search);
  const importType = searchParams.get('importType');

  const devfileInfo = React.useMemo(() => {
    let info;
    if (selectedSample) info = selectedSample;
    else if (devfile.devfileContent) {
      const devfileJSON = safeYAMLToJS(devfile.devfileContent);
      info = {
        displayName: devfileJSON.metadata?.name || 'Devfile',
        tags: devfileJSON.metadata?.version ? [devfileJSON.metadata.version] : [],
        iconClass: devfileJSON.metadata?.name ? `icon-${devfileJSON.metadata?.name}` : '',
      };
    }
    return info;
  }, [selectedSample, devfile]);

  const handleDevfileChange = React.useCallback(async () => {
    const gitService = getGitService(url, type, ref, dir, secretResource, devfile.devfilePath);
    const devfileContents = gitService && (await gitService.getDevfileContent());
    if (!devfileContents) {
      setFieldValue('devfile.devfileContent', null);
      setFieldValue('devfile.devfileHasError', true);
      setValidated(ValidatedOptions.error);
    } else {
      setFieldValue('devfile.devfileContent', devfileContents);
      setFieldValue('devfile.devfileHasError', false);
      setValidated(ValidatedOptions.success);
    }
  }, [devfile.devfilePath, dir, ref, secretResource, setFieldValue, type, url]);

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
    if (
      importType !== 'devfile' &&
      recommendedStrategy &&
      recommendedStrategy.type !== ImportStrategy.DEVFILE
    ) {
      const devfileStrategy = strategies.find((s) => s.type === ImportStrategy.DEVFILE);
      if (devfileStrategy) {
        setFieldValue('import.selectedStrategy.detectedFiles', devfileStrategy.detectedFiles);
        setFieldValue('devfile.devfilePath', devfileStrategy.detectedFiles?.[0]);
        setFieldValue('docker.dockerfilePath', 'Dockerfile');
        handleDevfileChange();
        validated === ValidatedOptions.success
          ? setFieldValue('import.strategyChanged', true)
          : setFieldValue('import.strategyChanged', false);
      }
      setFieldTouched('devfile.devfilePath', true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recommendedStrategy, setFieldValue, strategies]);

  React.useEffect(() => {
    importType === 'devfile' && devfile.devfilePath && handleDevfileChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [devfile.devfilePath, importType]);

  return (
    <>
      {devfileParseError && (
        <FormSection>
          <Alert
            isInline
            className="odc-devfile-strategy-section__error-alert"
            variant="danger"
            title={t('devconsole~Import is not possible.')}
          >
            {devfileParseError}
          </Alert>
        </FormSection>
      )}
      {showEditImportStrategy && importType !== 'devfile' && (
        <FormSection>
          <InputField
            type={TextInputTypes.text}
            name="devfile.devfilePath"
            label={t('devconsole~Devfile Path')}
            placeholder={t('devconsole~Enter Devfile path')}
            helpText={helpText}
            helpTextInvalid={helpText}
            validated={validated}
            onBlur={() => {
              handleDevfileChange();
              validated === ValidatedOptions.success
                ? setFieldValue('import.strategyChanged', true)
                : setFieldValue('import.strategyChanged', false);
            }}
            required
          />
        </FormSection>
      )}
      {devfileInfo && <DevfileInfo devfileSample={devfileInfo} />}
    </>
  );
};

export default DevfileStrategySection;
