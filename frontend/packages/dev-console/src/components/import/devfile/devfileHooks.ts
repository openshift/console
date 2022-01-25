import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { coFetchJSON } from '@console/internal/co-fetch';
import { getLimitsDataFromResource } from '@console/shared/src';
import { SAMPLE_APPLICATION_GROUP } from '../../../const';
import { DevfileSuggestedResources } from '../import-types';
import { createComponentName } from '../import-validation-utils';
import { DevfileSample } from './devfile-types';

export const suffixSlash = (val: string) => (val.endsWith('/') ? val : `${val}/`);
export const prefixDotSlash = (val) => (val.startsWith('/') ? `.${val}` : val);

export const useDevfileServer = (
  values: FormikValues,
  setFieldValue: (name: string, value: any, shouldValidate?: boolean) => any,
): [boolean, string] => {
  const { t } = useTranslation();
  const [devfileParseError, setDevfileParseError] = React.useState<string>(null);
  const [parsingDevfile, setParsingDevfile] = React.useState<boolean>(false);

  const {
    name,
    git: { url, ref, dir },
    devfile,
  } = values;
  const smartSlashDir = prefixDotSlash(suffixSlash(dir));

  const { devfileContent, devfilePath } = devfile || {};

  const devfileData = React.useMemo(() => {
    if (!name || !url || !devfileContent) {
      return null;
    }

    return {
      name,
      git: { URL: url, ref, dir: prefixDotSlash(dir) },
      devfile: { devfileContent, devfilePath: `${smartSlashDir}${devfilePath}` },
    };
  }, [name, url, devfileContent, ref, dir, smartSlashDir, devfilePath]);

  React.useEffect(() => {
    const setError = (msg) => {
      setDevfileParseError(msg);
      setFieldValue('devfile.devfileHasError', true);
    };
    const clearError = () => {
      setDevfileParseError(null);
      setFieldValue('devfile.devfileHasError', false);
    };

    if (devfileData === null) {
      clearError();
      return;
    }

    setParsingDevfile(true);
    coFetchJSON
      .post('/api/devfile/', devfileData)
      .then((value: DevfileSuggestedResources) => {
        setParsingDevfile(false);
        if (value) {
          clearError();
          const { imageStream, buildResource, deployResource, service, route } = value;

          if (deployResource.spec?.template?.spec?.containers?.length > 0) {
            const buildGuidanceContainer = deployResource.spec.template.spec.containers[0];

            setFieldValue('image.ports', buildGuidanceContainer.ports || [], false);
            setFieldValue('deployment.env', buildGuidanceContainer.env || [], false);
            setFieldValue('limits', getLimitsDataFromResource(deployResource), false);

            delete deployResource.spec.template.spec.containers;
          }

          setFieldValue('devfile.devfileSuggestedResources', {
            imageStream,
            buildResource,
            deployResource,
            service,
            route,
          });
          return;
        }

        // Failed to parse response, error out
        setError(t('devconsole~The Devfile in your Git repository is invalid.'));
      })
      .catch((e) => {
        setParsingDevfile(false);
        setError(e.message || t('devconsole~The Devfile in your Git repository is invalid.'));
      });
  }, [devfileData, setFieldValue, t]);

  return [parsingDevfile, devfileParseError];
};

export const useDevfileSource = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const devfileSourceUrl = searchParams.get('gitRepo');
  const devfileName = searchParams.get('devfileName');
  const formType = searchParams.get('formType');
  const { values, setFieldValue, setFieldTouched } = useFormikContext<FormikValues>();
  const {
    import: { recommendedStrategy },
    devfile,
  } = values;

  React.useEffect(() => {
    if (devfileSourceUrl && !devfile.devfileContent) {
      setFieldValue('devfile.devfileSourceUrl', devfileSourceUrl);
      setFieldValue('devfile.devfilePath', recommendedStrategy?.detectedFiles?.[0]);
      setFieldValue('docker.dockerfilePath', 'Dockerfile');
      if (formType === 'sample') {
        setFieldValue('name', createComponentName(devfileName));
        setFieldValue('application.initial', SAMPLE_APPLICATION_GROUP);
        setFieldValue('application.name', SAMPLE_APPLICATION_GROUP);
        setFieldValue('application.selectedKey', SAMPLE_APPLICATION_GROUP);
      }
    }
  }, [
    devfileSourceUrl,
    devfileName,
    formType,
    setFieldValue,
    setFieldTouched,
    recommendedStrategy,
    devfile.devfileContents,
    devfile.devfileContent,
  ]);
};

export const useSelectedDevfileSample = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const devfileName = searchParams.get('devfileName');
  const [devfileSamples, setDevfileSamples] = React.useState<DevfileSample[]>();

  React.useEffect(() => {
    let mounted = true;
    coFetchJSON('/api/devfile/samples/?registry=https://registry.devfile.io')
      .then((samples: DevfileSample[]) => {
        if (mounted) setDevfileSamples(samples);
      })
      .catch(() => {
        if (mounted) setDevfileSamples(null);
      });

    return () => (mounted = false);
  }, []);

  return React.useMemo(() => devfileSamples?.find((sample) => sample.name === devfileName), [
    devfileSamples,
    devfileName,
  ]);
};
