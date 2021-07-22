export type ResourceTarget = 'inputs' | 'outputs';

export type TektonParam = {
  default?: string | string[];
  description?: string;
  name: string;
  type?: 'string' | 'array';
};

export type TektonTaskSteps = {
  // TODO: Figure out required fields
  name: string;
  args?: string[];
  command?: string[];
  image?: string;
  resources?: {}[] | {};
  env?: { name: string; value: string }[];
  script?: string[];
};

export type TaskResult = {
  name: string;
  description?: string;
};

export type TektonTaskSpec = {
  metadata?: {};
  description?: string;
  steps: TektonTaskSteps[];
  params?: TektonParam[];
  resources?: TektonResourceGroup<TektonResource>;
  results?: TaskResult[];
  workspaces?: TektonWorkspace[];
};

export type TektonResourceGroup<ResourceType> = {
  inputs?: ResourceType[];
  outputs?: ResourceType[];
};

/** Deprecated upstream - Workspaces are replacing Resources */
export type TektonResource = {
  name: string;
  optional?: boolean;
  type: string; // TODO: limit to known strings
};

export type TektonWorkspace = {
  name: string;
  description?: string;
  mountPath?: string;
  readOnly?: boolean;
  optional?: boolean;
};

export type TektonResultsRun = {
  name: string;
  value: string;
};
