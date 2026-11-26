import type { K8sResourceCommon } from '@console/internal/module/k8s';

export type ClusterExtensionKind = K8sResourceCommon & {
  spec?: {
    namespace?: string;
    source?: {
      catalog?: {
        packageName?: string;
        version?: string;
        channels?: string[];
        selector?: {
          matchLabels?: Record<string, string>;
        };
      };
    };
    serviceAccount?: {
      name?: string;
    };
  };
  status?: {
    conditions?: {
      type: string;
      status: string;
      reason?: string;
      message?: string;
      lastTransitionTime?: string;
    }[];
    installedBundle?: {
      name?: string;
      version?: string;
    };
  };
};

/** Package channel and its available versions, sorted newest first. */
interface OLMCatalogChannel {
  name: string;
  versions: string[];
}

export type OLMCatalogItem = {
  id: string;
  capabilities: string;
  catalog: string;
  categories: string[];
  createdAt: string;
  description: string;
  displayName: string;
  hasIcon: boolean;
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
  channels?: OLMCatalogChannel[];
  versions?: string[];
  lifecycleData?: Record<string, unknown> | null;
};

export type OLMCatalogItemData = {
  categories: string[];
  latestVersion: string;
  channels: OLMCatalogChannel[];
  versions: string[];
  lifecycleData: Record<string, unknown> | null;
};
