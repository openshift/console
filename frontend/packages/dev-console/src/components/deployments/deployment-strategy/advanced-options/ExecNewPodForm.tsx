import type { FC } from 'react';
import { FormSection } from '@patternfly/react-core';
import type { FormikValues } from 'formik';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { DropdownField } from '@console/shared/src/components/formik-fields/DropdownField';
import { EnvironmentField } from '@console/shared/src/components/formik-fields/EnvironmentField';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { TextColumnField } from '@console/shared/src/components/formik-fields/text-column-field/TextColumnField';
import { getContainerNames } from '../../utils/deployment-utils';

interface ExecNewPodFormProps {
  resourceObj: K8sResourceKind;
  lifecycleHook: string;
  dataAttribute: string;
}

const ExecNewPodForm: FC<ExecNewPodFormProps> = ({ resourceObj, lifecycleHook, dataAttribute }) => {
  const { t } = useTranslation();
  const {
    values: {
      formData: { containers, deploymentStrategy },
    },
  } = useFormikContext<FormikValues>();

  return (
    <FormSection>
      <DropdownField
        name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.execNewPod.containerName`}
        label={t('devconsole~Container name')}
        title={t('devconsole~Select container name')}
        items={getContainerNames(containers)}
        fullWidth
        required
      />
      <TextColumnField
        name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.execNewPod.command`}
        label={t('devconsole~Command')}
        addLabel={t('devconsole~Add another argument')}
        placeholder={t('devconsole~Add argument')}
        helpText={t(
          'devconsole~Enter the command to run inside the container. The command is considered successful if its exit code is 0.',
        )}
        required
        disableDeleteRow={
          deploymentStrategy[dataAttribute][lifecycleHook].lch.execNewPod.command?.length === 1
        }
      />
      <EnvironmentField
        name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.execNewPod.env`}
        label={t('devconsole~Environment variables (runtime only)')}
        envs={deploymentStrategy[dataAttribute][lifecycleHook].lch.execNewPod.env ?? []}
        obj={resourceObj}
      />
      <InputField
        name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.execNewPod.volumes`}
        label={t('devconsole~Volumes')}
        helpText={t(
          'devconsole~List of comma (,) separated named volumes to copy to the hook pod.',
        )}
      />
    </FormSection>
  );
};

export default ExecNewPodForm;
