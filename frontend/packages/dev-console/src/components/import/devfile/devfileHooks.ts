import * as React from 'react';
import { FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { parseDevfile } from '@console/internal/module/k8s';
import { DevfileSuggestedResources } from '../import-types';

import { getLimitsData } from '../../edit-application/edit-application-utils';

const suffixSlash = (val: string) => (val.endsWith('/') ? val : `${val}/`);
const prefixDotSlash = (val) => (val.startsWith('/') ? `.${val}` : val);

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
  const { devfileContent, devfilePath } = devfile || {};

  const devfileData = React.useMemo(() => {
    if (!name || !url || !devfileContent) {
      return null;
    }

    return {
      name,
      git: { URL: url, ref, dir: prefixDotSlash(dir) },
      devfile: { devfileContent, devfilePath },
    };
  }, [name, url, ref, dir, devfileContent, devfilePath]);

  React.useEffect(() => {
    const setError = (msg) => {
      setDevfileParseError(msg);
      setFieldValue('devfile.devfileHasError', false);
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
    parseDevfile(devfileData)
      .then((value: DevfileSuggestedResources) => {
        setParsingDevfile(false);
        if (value) {
          clearError();
          const { imageStream, buildResource, deployResource, service, route } = value;

          if (deployResource.spec?.template?.spec?.containers?.length > 0) {
            const buildGuidanceContainer = deployResource.spec.template.spec.containers[0];

            setFieldValue('image.ports', buildGuidanceContainer.ports || [], false);
            setFieldValue('deployment.env', buildGuidanceContainer.env || [], false);
            setFieldValue('limits', getLimitsData(deployResource), false);

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

/**
 * Devfile [Dev Preview] work around for not having a Dockerfile (and Devfile) path in the form
 */
export const useDevfileDirectoryWatcher = (
  values: FormikValues,
  setFieldValue: (name: string, value: any) => void,
) => {
  const {
    git: { dir },
  } = values;
  React.useEffect(() => {
    const smartSlashDir = prefixDotSlash(suffixSlash(dir));

    setFieldValue('devfile.devfilePath', `${smartSlashDir}devfile.yaml`);
    setFieldValue('docker.dockerfilePath', `${smartSlashDir}Dockerfile`);
  }, [dir, setFieldValue]);
};
