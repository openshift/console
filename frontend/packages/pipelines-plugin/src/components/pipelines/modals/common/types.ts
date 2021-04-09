import { FormikValues } from 'formik';
import { VolumeTypes } from '../../const';
import {
  TektonParam,
  TektonWorkspace,
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

export type PipelineModalFormWorkspace = TektonWorkspace & {
  type: VolumeTypes;
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
