import { CommonPipelineModalFormikValues } from '../common/types';

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  secretOpen: boolean;
};
