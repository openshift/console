import * as React from 'react';
import { FormSection } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DropdownField, EnvironmentField, InputField, TextColumnField } from '@console/shared/src';
import { getContainerNames } from '../../utils/edit-deployment-utils';

interface ExecNewPodFormProps {
  resourceObj: K8sResourceKind;
  lifecycleHook: string;
  dataAttribute: string;
}

const ExecNewPodForm: React.FC<ExecNewPodFormProps> = ({
  resourceObj,
  lifecycleHook,
  dataAttribute,
}) => {
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
          'devconsole~Enter the command to run inside the container. The command is considered sucessful if its exit code is 0. Drag and drop to reorder arguments.',
        )}
        required
        dndEnabled
        disableDeleteRow={
          deploymentStrategy[dataAttribute][lifecycleHook].lch.execNewPod.command?.length === 1
        }
      />
      <EnvironmentField
        name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.execNewPod.env`}
        label={t('devconsole~Environment variables (runtime only)')}
        envs={deploymentStrategy[dataAttribute][lifecycleHook].lch.execNewPod.env ?? []}
        obj={resourceObj}
        envPath={['spec', 'template', 'spec', 'containers']}
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
