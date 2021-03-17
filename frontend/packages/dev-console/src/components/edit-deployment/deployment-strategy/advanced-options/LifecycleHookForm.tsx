import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { useFormikContext, FormikValues } from 'formik';
import { DropdownField, RadioGroupField } from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { lifecycleActionType } from '../utils/deployment-strategy-utils';
import { FailurePolicyOptions, LifecycleAction } from '../utils/types';
import ExecNewPodForm from './ExecNewPodForm';
import TagImagesForm from './TagImagesForm';

const LifecycleHookForm: React.FC<{ lifecycleHook: string; resourceObj: K8sResourceKind }> = ({
  lifecycleHook,
  resourceObj,
}) => {
  const { t } = useTranslation();
  const {
    values: {
      deploymentStrategy: { data },
    },
  } = useFormikContext<FormikValues>();
  return (
    <>
      <RadioGroupField
        name={`deploymentStrategy.data.${lifecycleHook}.lifecycleAction`}
        options={[
          {
            label: lifecycleActionType(t).execNewPod.label,
            value: lifecycleActionType(t).execNewPod.label,
            isDisabled: data[lifecycleHook].lifecycleAction === LifecycleAction.tagImages,
            activeChildren: (
              <ExecNewPodForm resourceObj={resourceObj} lifecycleHook={lifecycleHook} />
            ),
          },
          {
            label: lifecycleActionType(t).tagImages.label,
            value: lifecycleActionType(t).tagImages.value,
            isDisabled: data[lifecycleHook].lifecycleAction === LifecycleAction.execNewPod,
            activeChildren: <TagImagesForm lifecycleHook={lifecycleHook} />,
          },
        ]}
      />
      <DropdownField
        name={`deploymentStrategy.data.${lifecycleHook}.failurePolicy`}
        label={t('devconsole~Failure Policy')}
        items={FailurePolicyOptions}
        helpText={t('devconsole~Fail the deployment if the hook fails')}
        required
      />
    </>
  );
};

export default LifecycleHookForm;
