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
  resources?: {}[];
  script?: string[];
};

// Deprecated upstream, workspaces are more desired
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
  // TODO: Support Optional
};

export type TektonResultsRun = {
  name: string;
  value: string;
};
