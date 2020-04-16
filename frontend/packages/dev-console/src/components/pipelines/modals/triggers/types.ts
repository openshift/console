import { FormikValues } from 'formik';

export type RemoveTriggerFormValues = FormikValues & {
  selectedTrigger: string;
};
