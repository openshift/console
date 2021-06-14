import * as React from 'react';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { EnvironmentField, InputField, TextColumnField } from '@console/shared/src';
import { StrategyFieldProps } from './utils/types';

const CustomStrategy: React.FC<StrategyFieldProps> = ({ resourceObj }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: {
        deploymentStrategy: { customParams },
      },
    },
  } = useFormikContext<FormikValues>();
  return (
    <>
      <InputField
        name="formData.deploymentStrategy.customParams.image"
        label={t('devconsole~Image name')}
        helpText={t('devconsole~An image that can carry out the deployment.')}
      />
      <TextColumnField
        name="formData.deploymentStrategy.customParams.command"
        label={t('devconsole~Command')}
        addLabel={t('devconsole~Add another argument')}
        placeholder={t('devconsole~Add argument')}
        helpText={t(
          'devconsole~Enter the command to run inside the container. The command is considered successful if its exit code is 0. Drag and drop to reorder arguments.',
        )}
        dndEnabled
      />
      <EnvironmentField
        name="formData.deploymentStrategy.customParams.environment"
        label={t('devconsole~Environment variables (runtime only)')}
        envs={customParams.environment ?? []}
        obj={resourceObj}
        envPath={['spec', 'strategy', 'customParams']}
      />
    </>
  );
};

export default CustomStrategy;
