import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { DropdownField, EnvironmentField, InputField, TextColumnField } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { getContainerNames } from '../../utils/edit-deployment-utils';

const ExecNewPodForm: React.FC<{ resourceObj: K8sResourceKind; lifecycleHook: string }> = ({
  resourceObj,
  lifecycleHook,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      containers,
      deploymentStrategy: { data },
    },
  } = useFormikContext<FormikValues>();

  return (
    <>
      <DropdownField
        name={`deploymentStrategy.data.${lifecycleHook}.execNewPod.containerName`}
        label={t('devconsole~Container name')}
        items={getContainerNames(containers)}
        selectedKey={data[lifecycleHook].execNewPod.containerName}
        required
      />
      <TextColumnField
        name={`deploymentStrategy.data.${lifecycleHook}.execNewPod.command`}
        label={t('devconsole~Command')}
        addLabel={t('devconsole~Add another argument')}
        placeholder={t('devconsole~Add argument')}
        helpText={t(
          'devconsole~Enter the command to run inside the container. The command is considered sucessful if its exit code is 0. Drag and drop to reorder arguments.',
        )}
        required
        disableDeleteRow={data[lifecycleHook].execNewPod.command?.length === 1}
      />
      <EnvironmentField
        name={`deploymentStrategy.data.${lifecycleHook}.execNewPod.env`}
        label={t('devconsole~Environment variables (runtime only')}
        envs={data[lifecycleHook].execNewPod.env}
        obj={resourceObj}
        envPath={['spec', 'template', 'spec', 'containers']}
      />
      <InputField
        name={`deploymentStrategy.data.${lifecycleHook}.execNewPod.volumes`}
        label={t('devconsole~Volumes')}
        helpText={t('devconsole~List of named volumes to copy to the hook pod.')}
      />
    </>
  );
};

export default ExecNewPodForm;
