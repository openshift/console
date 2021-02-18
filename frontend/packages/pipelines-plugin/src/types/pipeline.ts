import { K8sResourceCommon } from '@console/internal/module/k8s';
import { TektonParam, TektonResource } from './coreTekton';

export type PipelineTaskWorkspace = {
  description?: string;
  mountPath?: string;
  name: string;
  readOnly?: boolean;
  workspace?: string;
};

export type PipelineTaskRef = {
  kind?: string;
  name: string;
};

export type PipelineTaskSpec = {
  metadata?: {
    labels?: { [key: string]: string };
  };
  steps: {
    name: string;
    image?: string;
    args?: string[];
    script?: string[];
  }[];
};

export type PipelineTaskResource = {
  name: string;
  resource?: string;
  from?: string[];
};

export type PipelineTaskResources = {
  inputs?: PipelineTaskResource[];
  outputs?: PipelineTaskResource[];
};

export type PipelineTaskParam = {
  name: string;
  value: any;
};

export type WhenExpression = {
  Input: string;
  Operator: string;
  Values: string[];
};

export type PipelineResult = {
  name: string;
  value: string;
  description?: string;
};

export type PipelineTask = {
  name: string;
  params?: PipelineTaskParam[];
  resources?: PipelineTaskResources;
  runAfter?: string[];
  taskRef?: PipelineTaskRef;
  taskSpec?: PipelineTaskSpec;
  when?: WhenExpression[];
  workspaces?: PipelineTaskWorkspace[];
};

export type PipelineWorkspace = {
  name: string;
};

export type PipelineSpec = {
  params?: TektonParam[];
  resources?: TektonResource[];
  serviceAccountName?: string;
  tasks: PipelineTask[];
  workspaces?: PipelineWorkspace[];
  finally?: PipelineTask[];
  results?: PipelineResult[];
};

export type PipelineKind = K8sResourceCommon & {
  spec: PipelineSpec;
};
