export type TektonHubLatestVersion = {
  id: number;
  version: string;
  displayName: string;
  description: string;
  minPipelinesVersion: string;
  rawURL: string;
  webURL: string;
  updatedAt: string;
};

export type TektonHubCategory = {
  id: number;
  name: string;
};

export type TektonHubTag = {
  id: number;
  name: string;
};

export type TektonHubTask = {
  id: number;
  name: string;
  categories: TektonHubCategory[];
  catalog: {
    id: number;
    name: string;
    type: string;
  };
  kind: string;
  latestVersion: TektonHubLatestVersion;
  tags: TektonHubTag[];
  rating: number;
};
