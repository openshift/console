import { ObjectMetadata, ContainerSpec } from '@console/internal/module/k8s';

export interface Pod {
  id?: string;
  name?: string;
  kind?: string;
  metadata?: ObjectMetadata;
  status: { phase: string };
  spec: {
    containers: ContainerSpec[];
  };
}

export interface ResourceProps {
  kind: string;
  apiVersion?: string;
  metadata: ObjectMetadata;
  status: {
    [key: string]: any;
  };
  spec: {
    [key: string]: any;
  };
}

export interface Resource {
  data: ResourceProps[];
}

export interface PodDataResources {
  replicationControllers: Resource;
  replicasets: Resource;
  pods: Resource;
  deploymentConfigs?: Resource;
  deployments?: Resource;
}
