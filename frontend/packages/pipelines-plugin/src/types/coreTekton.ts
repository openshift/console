export type TektonParam = {
  default?: string | string[];
  description?: string;
  name: string;
  type?: 'string' | 'array';
};

// Deprecated upstream, workspaces are more desired
export type TektonResource = {
  name: string;
  optional?: boolean;
  type: string; // TODO: limit to known strings
};

export type TektonResultsRun = {
  name: string;
  value: string;
};
