export type OLMCatalogItem = {
  id: string;
  capabilities: string;
  catalog: string;
  categories: string[];
  createdAt: string;
  description: string;
  displayName: string;
  image: string;
  infrastructureFeatures: string[];
  keywords: string[];
  markdownDescription: string;
  name: string;
  provider: string;
  repository: string;
  source: string;
  support: string;
  validSubscription: string[];
  version: string;
};

export type OLMCatalogItemData = {
  categories: string[];
  latestVersion: string;
};
