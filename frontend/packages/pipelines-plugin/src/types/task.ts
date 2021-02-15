import { K8sResourceCommon } from '@console/internal/module/k8s';
import { TektonParam, TektonResource } from './coreTekton';

export type TaskKind = K8sResourceCommon & {
  spec: {
    params?: TektonParam[];
    resources?: {
      inputs?: TektonResource[];
      outputs?: TektonResource[];
    };

    steps: {
      // TODO: Figure out required fields
      name: string;
      args?: string[];
      command?: string[];
      image?: string;
      resources?: {}[];
    }[];
  };
};
