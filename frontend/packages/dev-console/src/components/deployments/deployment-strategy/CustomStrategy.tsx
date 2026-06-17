import type { FC } from 'react';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { EnvironmentField } from '@console/shared/src/components/formik-fields/EnvironmentField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { TextColumnField } from '@console/shared/src/components/formik-fields/text-column-field/TextColumnField';
import type { StrategyFieldProps } from './utils/types';

const CustomStrategy: FC<StrategyFieldProps> = ({ resourceObj }) => {
  const { t } = useTranslation('devconsole');
  const {
    values: {
      formData: {
        deploymentStrategy: { customParams },
      },
    },
  } = useFormikContext<FormikValues>();
  return (
    <div data-test="customParams">
      <InputField
        name="formData.deploymentStrategy.customParams.image"
        label={t('Image name')}
        helpText={t('An image that can carry out the deployment.')}
      />
      <TextColumnField
        name="formData.deploymentStrategy.customParams.command"
        label={t('Command')}
        addLabel={t('Add another argument')}
        placeholder={t('Add argument')}
        helpText={t(
          'Enter the command to run inside the container. The command is considered successful if its exit code is 0.',
        )}
      />
      <EnvironmentField
        name="formData.deploymentStrategy.customParams.environment"
        label={t('Environment variables (runtime only)')}
        envs={customParams.environment ?? []}
        obj={resourceObj}
      />
    </div>
  );
};

export default CustomStrategy;
