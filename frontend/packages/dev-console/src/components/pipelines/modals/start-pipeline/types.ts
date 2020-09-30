import {
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from 'packages/dev-console/src/utils/pipeline-augment';
import { CommonPipelineModalFormikValues } from '../common/types';

export type PipelineRunWorkspaceFormEntry = {
  name: string;
  type: string;
  [volumeType: string]: VolumeTypeSecret | VolumeTypeConfigMaps | VolumeTypePVC | {};
};

export type StartPipelineFormValues = CommonPipelineModalFormikValues & {
  workspaces: PipelineRunWorkspaceFormEntry[];
  secretOpen: boolean;
};
