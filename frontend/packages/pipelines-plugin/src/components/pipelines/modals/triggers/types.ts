import { FormikValues } from 'formik';
import { TriggerBindingKind } from '../../resource-types';
import { CommonPipelineModalFormikValues } from '../common/types';

export type RemoveTriggerFormValues = FormikValues & {
  selectedTrigger: string;
};

export type AddTriggerFormValues = CommonPipelineModalFormikValues & {
  triggerBinding: {
    name: string;
    resource: TriggerBindingKind;
  };
};
