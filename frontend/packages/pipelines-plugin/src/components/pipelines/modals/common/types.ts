import { FormikValues } from 'formik';
import {
  TektonParam,
  VolumeTypeClaim,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from '../../../../types';

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
      }
    | {
        volumeClaimTemplate: VolumeTypeClaim;
      };
};

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: TektonParam[];
  resources: PipelineModalFormResource[];
  workspaces: PipelineModalFormWorkspace[];
};
