import * as React from 'react';
import { useFormikContext, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ActionGroupWithIcons, DropdownField, RadioGroupField } from '@console/shared/src';
import FormSection from '../../../import/section/FormSection';
import { lifecycleActionType } from '../utils/deployment-strategy-utils';
import { FailurePolicyOptions } from '../utils/types';
import ExecNewPodForm from './ExecNewPodForm';
import TagImagesForm from './TagImagesForm';
import './LifecycleHookForm.scss';

interface LifecycleHookFormProps {
  lifecycleHook: string;
  resourceObj: K8sResourceKind;
  dataAttribute: string;
  onSubmit: () => void;
  onClose: () => void;
}

const LifecycleHookForm: React.FC<LifecycleHookFormProps> = ({
  lifecycleHook,
  resourceObj,
  dataAttribute,
  onSubmit,
  onClose,
}) => {
  const { t } = useTranslation();
  const { errors } = useFormikContext<FormikValues>();
  return (
    <div className="odc-deployment-lifecycle-hook-form">
      <FormSection>
        <RadioGroupField
          name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.action`}
          label={t('devconsole~Lifecycle Action')}
          required
          options={[
            {
              label: lifecycleActionType(t).execNewPod.label,
              value: lifecycleActionType(t).execNewPod.value,
              activeChildren: (
                <ExecNewPodForm
                  resourceObj={resourceObj}
                  lifecycleHook={lifecycleHook}
                  dataAttribute={dataAttribute}
                />
              ),
            },
            {
              label: lifecycleActionType(t).tagImages.label,
              value: lifecycleActionType(t).tagImages.value,
              activeChildren: <TagImagesForm lifecycleHook={lifecycleHook} />,
            },
          ]}
        />
        <DropdownField
          name={`formData.deploymentStrategy.${dataAttribute}.${lifecycleHook}.lch.failurePolicy`}
          label={t('devconsole~Failure Policy')}
          title={t('devconsole~Select a Failure Policy')}
          items={FailurePolicyOptions}
          helpText={t('devconsole~Fail the deployment if the hook fails.')}
          fullWidth
          required
        />
        <ActionGroupWithIcons
          onSubmit={onSubmit}
          onClose={onClose}
          isDisabled={
            !_.isEmpty(
              _.get(errors?.formData, [
                'deploymentStrategy',
                `${dataAttribute}`,
                `${lifecycleHook}`,
              ]),
            ) ||
            !_.isEmpty(
              _.get(errors?.formData, [
                'deploymentStrategy',
                'imageStreamData',
                `${lifecycleHook}`,
              ]),
            )
          }
        />
      </FormSection>
    </div>
  );
};

export default LifecycleHookForm;
