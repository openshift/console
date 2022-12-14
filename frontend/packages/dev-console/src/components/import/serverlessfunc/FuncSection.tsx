import * as React from 'react';
import { FormSection, ValidatedOptions } from '@patternfly/react-core';
import { FormikValues, useFormikContext } from 'formik';
import { getGitService, ImportStrategy } from '@console/git-service/src';
import { evaluateFunc } from '@console/git-service/src/utils/serverless-strategy-detector';
import BuilderImageSelector from '../builder/BuilderImageSelector';

const FuncSection = ({ builderImages }) => {
  const { values, setFieldValue } = useFormikContext<FormikValues>();
  const {
    import: { strategies, recommendedStrategy },
    git: { url, type, ref, dir, secretResource },
  } = values;
  const [validated, setValidated] = React.useState<ValidatedOptions>(ValidatedOptions.default);

  React.useEffect(() => {
    if (recommendedStrategy && recommendedStrategy.type !== ImportStrategy.SERVERLESS_FUNCTION) {
      const funcStrategy = strategies.find((s) => s.type === ImportStrategy.SERVERLESS_FUNCTION);
      if (funcStrategy) {
        setFieldValue('import.selectedStrategy.detectedFiles', funcStrategy.detectedFiles);
        validated === ValidatedOptions.success
          ? setFieldValue('import.strategyChanged', true)
          : setFieldValue('import.strategyChanged', false);
      }
    }
  }, [recommendedStrategy, setFieldValue, strategies, validated]);

  React.useEffect(() => {
    const gitService = getGitService(url, type, ref, dir, secretResource);
    evaluateFunc(gitService)
      .then((res) => {
        if (res) {
          setValidated(ValidatedOptions.success);
          setFieldValue('serverlessFunction.funcHasError', false);
          setFieldValue('serverlessFunction.funcData.builder', res.values.builder);
          setFieldValue('serverlessFunction.funcData.runtime', res.values.runtime);
          setFieldValue('serverlessFunction.funcData.builderEnvs', res.values.builderEnvs);
          setFieldValue('serverlessFunction.funcData.runtimeEnvs', res.values.runtimeEnvs);
        } else {
          setValidated(ValidatedOptions.error);
          setFieldValue('func.funcHasError', true);
        }
      })
      .catch(() => {
        setValidated(ValidatedOptions.error);
        setFieldValue('func.funcHasError', true);
      });
  }, [setFieldValue, url, type, ref, dir, secretResource]);

  return (
    <div>
      <h1>FuncSection</h1>
      <FormSection>
        <BuilderImageSelector loadingImageStream={!builderImages} builderImages={builderImages} />
      </FormSection>
    </div>
  );
};

export default FuncSection;
