import { K8sResourceCommon } from '@console/internal/module/k8s';
import { TektonParam, TektonResource, TektonTaskSteps, TektonWorkspace } from './coreTekton';

export type PipelineTaskRef = {
  kind?: string;
  name: string;
};

export type PipelineTaskSpec = {
  metadata?: {
    labels?: { [key: string]: string };
  };
  steps: TektonTaskSteps[];
};

export type PipelineTaskWorkspace = {
  name: string;
  workspace: string;
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

export type PipelineSpec = {
  params?: TektonParam[];
  resources?: TektonResource[];
  serviceAccountName?: string;
  tasks: PipelineTask[];
  workspaces?: TektonWorkspace[];
  finally?: PipelineTask[];
  results?: PipelineResult[];
};

export type PipelineKind = K8sResourceCommon & {
  spec: PipelineSpec;
};
