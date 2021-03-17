import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikValues, useFormikContext } from 'formik';
import { EnvironmentField, InputField, TextColumnField } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';

const CustomStrategy: React.FC<{ resourceObj: K8sResourceKind }> = ({ resourceObj }) => {
  const { t } = useTranslation();
  const {
    values: {
      deploymentStrategy: {
        data: { command, environment },
      },
    },
  } = useFormikContext<FormikValues>();
  return (
    <>
      <InputField
        name="deploymentStrategy.data.image"
        label={t('devconsole~Image name')}
        helpText={t('devconsole~An image that can carry out the deployment.')}
      />
      <TextColumnField
        name="deploymentStrategy.data.command"
        label={t('devconsole~Command')}
        addLabel={t('devconsole~Add another argument')}
        placeholder={t('devconsole~Add argument')}
        helpText={t(
          'devconsole~Enter the command to run inside the container. The command is considered sucessful if its exit code is 0. Drag and drop to reorder arguments.',
        )}
        required
        disableDeleteRow={command?.length === 1}
      />
      <EnvironmentField
        name="deploymentStrategy.data.environment"
        label={t('devconsole~Environment variables (runtime only')}
        envs={environment}
        obj={resourceObj}
        envPath={['spec', 'strategy', 'customParams']}
      />
    </>
  );
};

export default CustomStrategy;
