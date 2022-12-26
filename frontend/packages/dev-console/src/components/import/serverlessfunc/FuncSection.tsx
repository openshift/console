import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { BuilderImage } from '@console/dev-console/src/utils/imagestream-utils';
import { getGitService } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import { Loading } from '@console/internal/components/utils';
import BuilderImageTagSelector from '../builder/BuilderImageTagSelector';
import { Resources } from '../import-types';
import { useResourceType } from '../section/useResourceType';
import { getRuntimeImage, Runtime } from './func-utils';

const FuncSection = ({ builderImages }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    git: { url, type, ref, dir, secretResource },
  } = values;
  const [runtimeImage, setRuntimeImage] = React.useState<BuilderImage>(null);
  const [, setResourceType] = useResourceType();

  React.useEffect(() => {
    const gitService = getGitService(url, type, ref, dir, secretResource);
    evaluateFunc(gitService)
      .then((res) => {
        setResourceType(Resources.KnativeService);
        setRuntimeImage(getRuntimeImage(res.values.runtime as Runtime, builderImages));
        setFieldValue('resources', Resources.KnativeService);
        setFieldValue('serverlessFunction.funcHasError', false);
        setFieldValue('serverlessFunction.funcData.builder', res.values.builder);
        setFieldValue('serverlessFunction.funcData.runtime', res.values.runtime);
        setFieldValue('serverlessFunction.funcData.builderEnvs', res.values.builderEnvs);
        setFieldValue('serverlessFunction.funcData.runtimeEnvs', res.values.runtimeEnvs);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Error fetching Serverless Function YAML: ', err);
        setFieldValue('func.funcHasError', true);
      });
  }, [setFieldValue, url, type, ref, dir, secretResource, setResourceType, builderImages]);

  return runtimeImage ? (
    <FormSection extraMargin>
      <BuilderImageTagSelector
        selectedBuilderImage={runtimeImage}
        selectedImageTag={runtimeImage?.recentTag?.name}
      />
    </FormSection>
  ) : (
    <Loading />
  );
};

export default FuncSection;
