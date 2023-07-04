import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { BuilderImage } from '@console/dev-console/src/utils/imagestream-utils';
import { getGitService } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import { Loading } from '@console/internal/components/utils';
import {
  notSupportedRuntime,
  SupportedRuntime,
  getRuntimeImage,
} from '../../../utils/serverless-functions';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import { Resources } from '../import-types';
import { useResourceType } from '../section/useResourceType';
import './FuncSection.scss';

const FuncSection = ({ builderImages }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setFieldError, errors } = useFormikContext<FormikValues>();
  const {
    git: { url, type, ref, dir, secretResource },
    image,
  } = values;
  const [runtimeImage, setRuntimeImage] = React.useState<BuilderImage>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [, setResourceType] = useResourceType();
  const [helpText, setHelpText] = React.useState<string>('');

  React.useEffect(() => {
    const gitService = url && getGitService(url, type, ref, dir, secretResource);
    gitService &&
      evaluateFunc(gitService)
        .then((res) => {
          setResourceType(Resources.KnativeService);
          setRuntimeImage(getRuntimeImage(res.values.runtime as SupportedRuntime, builderImages));
          if (notSupportedRuntime.includes(res.values.runtime)) {
            setHelpText(
              t('devconsole~Support for {{runtime}} is not yet available.', {
                runtime: res.values.runtime,
              }),
            );
          } else {
            setHelpText(
              t(
                'devconsole~Unsupported Runtime detected. Please update the Repository URL or change the Build Strategy to continue.',
              ),
            );
          }
          setFieldValue('resources', Resources.KnativeService);
          setFieldValue('build.env', res.values.builderEnvs);
          setFieldValue('deployment.env', res.values.runtimeEnvs);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn('Error fetching Serverless Function YAML: ', err);
          setFieldError('ServerlessFunction', err.message);
        })
        .finally(() => setLoaded(true));
  }, [
    setFieldValue,
    setFieldError,
    url,
    type,
    ref,
    dir,
    secretResource,
    setResourceType,
    builderImages,
    setHelpText,
    t,
  ]);

  React.useEffect(() => {
    if (loaded && runtimeImage) {
      setFieldValue('image.tag', runtimeImage?.recentTag?.name);
      setFieldValue('image.selected', runtimeImage?.name);
      setFieldValue('image.recommended', runtimeImage?.name);
    }
  }, [runtimeImage, setFieldValue, loaded]);

  React.useEffect(() => {
    if (loaded && !runtimeImage) {
      setFieldError('ServerlessFunction', 'Unsupported Runtime detected');
    }
  }, [setFieldError, loaded, runtimeImage, errors]);

  if (loaded && !runtimeImage) {
    return (
      <FormSection>
        <Alert
          className="odc-func-strategy-section__error-alert"
          isInline
          variant="danger"
          title={t('devconsole~Import is not possible.')}
        >
          {helpText}
        </Alert>
      </FormSection>
    );
  }

  return loaded ? (
    <FormSection extraMargin>
      <BuilderImageTagSelector selectedBuilderImage={runtimeImage} selectedImageTag={image.tag} />
    </FormSection>
  ) : (
    <Loading />
  );
};

export default FuncSection;
