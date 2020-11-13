import { FormikValues } from 'formik';
import { CommonPipelineModalFormikValues } from '../common/types';
import { TriggerBindingKind } from '../../resource-types';

export type RemoveTriggerFormValues = FormikValues & {
  selectedTrigger: string;
};

export type AddTriggerFormValues = CommonPipelineModalFormikValues & {
  triggerBinding: {
    name: string;
    resource: TriggerBindingKind;
  };
};
