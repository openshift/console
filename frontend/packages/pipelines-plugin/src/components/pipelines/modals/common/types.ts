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

export type PipelineModalFormWorkspaceStructure =
  | {
      type: VolumeTypes.NoWorkspace;
      data: {};
    }
  | {
      type: VolumeTypes.EmptyDirectory;
      data: {
        emptyDir: {};
      };
    }
  | {
      type: VolumeTypes.Secret;
      data: {
        secret: VolumeTypeSecret;
      };
    }
  | {
      type: VolumeTypes.ConfigMap;
      data: {
        configMap: VolumeTypeConfigMaps;
      };
    }
  | {
      type: VolumeTypes.PVC;
      data: {
        persistentVolumeClaim: VolumeTypePVC;
      };
    }
  | {
      type: VolumeTypes.VolumeClaimTemplate;
      data: {
        volumeClaimTemplate: VolumeTypeClaim;
      };
    };

export type PipelineModalFormWorkspace = TektonWorkspace & PipelineModalFormWorkspaceStructure;

export type ModalParameter = TektonParam & {
  value?: string | string[];
};

export type CommonPipelineModalFormikValues = FormikValues & {
  namespace: string;
  parameters: ModalParameter[];
  resources: PipelineModalFormResource[];
  workspaces: PipelineModalFormWorkspace[];
};
