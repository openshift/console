export type TektonHubItem = {
  id: number;
  name: string;
};

export type TektonHubCategory = TektonHubItem;

export type TektonHubTag = TektonHubItem;

export type TektonHubPlatform = TektonHubItem;

export type TektonHubCatalog = TektonHubItem & {
  type: string;
};

export type TektonHubLatestVersion = {
  id: number;
  version: string;
  displayName: string;
  description: string;
  minPipelinesVersion: string;
  rawURL: string;
  webURL: string;
  hubURL: string;
  platforms: TektonHubPlatform[];
  updatedAt: string;
};

export type TektonHubTask = {
  id: number;
  name: string;
  categories: TektonHubCategory[];
  catalog: TektonHubCatalog;
  platforms: TektonHubPlatform[];
  kind: string;
  latestVersion: TektonHubLatestVersion;
  tags: TektonHubTag[];
  rating: number;
};
