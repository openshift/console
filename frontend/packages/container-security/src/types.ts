import { K8sResourceCommon } from '@console/internal/module/k8s';

export type Feature = {
  name: string;
  versionformat: string;
  namespaceName: string;
  version: string;
  vulnerabilities: Vulnerability[];
};

export type Vulnerability = {
  name: string;
  namespaceName: string;
  description: string;
  link: string;
  fixedby: string;
  severity: string;
  metadata?: string;
};

export type ImageManifestVulnSpec = {
  image: string;
  manifest: string;
  namespaceName: string;
  features: Feature[];
};

export type ImageManifestVulnStatus = {
  lastUpdate?: string;
  highestSeverity: string;
  unknownCount?: number;
  negligibleCount?: number;
  lowCount?: number;
  mediumCount?: number;
  highCount?: number;
  criticalCount?: number;
  defcon1Count?: number;
  fixableCount?: number;
  affectedPods: { [path: string]: string[] };
};

export type ImageManifestVuln = {
  spec: ImageManifestVulnSpec;
  status: ImageManifestVulnStatus;
} & K8sResourceCommon;

export type WatchImageVuln = {
  imageManifestVuln: ImageManifestVuln[];
};
