import * as React from 'react';
import { Alert, TextInputTypes, ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { getGitService, ImportStrategy, GitProvider } from '@console/git-service/src';
import { InputField } from '@console/shared/src';
import { useTelemetry } from '@console/shared/src/hooks/useTelemetry';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { ImportTypes, SampleRuntime } from '../import-types';
import FormSection from '../section/FormSection';
import { useDevfileServer, useDevfileSource, useSelectedDevfileSample } from './devfileHooks';
import DevfileInfo from './DevfileInfo';
import './DevfileStrategySection.scss';

const DevfileStrategySection: React.FC = () => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const fireTelemetryEvent = useTelemetry();
  const {
    import: { showEditImportStrategy, strategies, recommendedStrategy, selectedStrategy },
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
    if (selectedSample) {
      info = selectedSample;
      setFieldValue('devfile.devfileProjectType', SampleRuntime[selectedSample.projectType ?? '']);
    } else if (devfile.devfileContent) {
      const devfileJSON = safeYAMLToJS(devfile.devfileContent);
      info = {
        displayName: devfileJSON.metadata?.name || 'Devfile',
        tags: devfileJSON.metadata?.version ? [devfileJSON.metadata.version] : [],
        iconClass: devfileJSON.metadata?.name ? `icon-${devfileJSON.metadata?.name}` : '',
      };
    }
    return info;
  }, [selectedSample, devfile.devfileContent, setFieldValue]);

  const handleDevfileChange = React.useCallback(async () => {
    const gitService = getGitService(url, type, ref, dir, secretResource, devfile.devfilePath);
    const devfileContents = gitService && (await gitService.getDevfileContent());
    if (!devfileContents) {
      setFieldValue('devfile.devfileContent', null);
      setFieldValue('devfile.devfileHasError', true);
      setValidated(ValidatedOptions.error);
    } else {
      if (selectedSample != null) {
        fireTelemetryEvent('Download Devfile from Git', {
          client: 'openshift-console',
          devfileName: selectedSample.name,
        });
      }

      setFieldValue('devfile.devfileContent', devfileContents);
      setFieldValue('devfile.devfileHasError', false);
      setValidated(ValidatedOptions.success);
    }
  }, [
    devfile,
    dir,
    fireTelemetryEvent,
    ref,
    secretResource,
    selectedSample,
    setFieldValue,
    type,
    url,
  ]);

  const helpText = React.useMemo(() => {
    if (validated === ValidatedOptions.success) {
      return t('devconsole~Validated');
    }
    if (validated === ValidatedOptions.error) {
      if (type === GitProvider.UNSURE) {
        return t('devconsole~Could not get Devfile for an unknown Git type');
      }
      return t('devconsole~Devfile not detected');
    }
    return t(
      'devconsole~Allows the builds to use a different path to locate your Devfile, relative to the Context Dir field',
    );
  }, [t, type, validated]);

  React.useEffect(() => {
    if (
      importType !== ImportTypes.devfile &&
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
    (importType === ImportTypes.devfile || selectedStrategy.type === ImportStrategy.DEVFILE) &&
      devfile.devfilePath &&
      handleDevfileChange();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [importType, devfile.devfilePath, selectedStrategy.type]);

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
            data-test="git-form-devfile-path-input"
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
