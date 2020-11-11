import { FormikValues } from 'formik';
import {
  PipelineParam,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from '../../../../utils/pipeline-augment';

export type PipelineModalFormResource = {
  name: string;
  selection: string;
  data: {
    type: string;
    params: { [key: string]: string };
    secrets?: { [key: string]: string };
  };
};

export type PipelineModalFormWorkspace = {
  name: string;
  type: string;
  data:
    | {
        emptyDir: {};
      }
    | {
        secret: VolumeTypeSecret;
      }
    | {
        configMap: VolumeTypeConfigMaps;
      }
    | {
        persistentVolumeClaim: VolumeTypePVC;
      };
};

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: PipelineParam[];
  resources: PipelineModalFormResource[];
  workspaces: PipelineModalFormWorkspace[];
};
