import { CommonPipelineModalFormikValues } from '../common/types';
import { PipelineWorkspace } from '../../../../utils/pipeline-augment';

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  workspaces: PipelineWorkspace[];
  secretOpen: boolean;
};
