import { K8sResourceCommon } from '@console/internal/module/k8s';

export interface CloudKafka {
  id: string;
  kind: string;
  href: string;
  status: string;
  cloudProvider: string;
  multiAz: true;
  region: string;
  owner: string;
  name: string;
  bootstrapServerHost: string;
  createdAt: string;
  updatedAt: string;
}

export interface KafkaConnection extends K8sResourceCommon {
  spec: {
    accessTokenSecretName: string;
    credentials: {
      serviceAccountSecretName: string;
    };
  };
  status: {
    bootstrapServerHost: string;
    conditions: StatusCondition[];
    metadata: any;
  };
}

export interface KafkaRequest extends K8sResourceCommon {
  spec: {
    accessTokenSecretName: string;
  };
  status: { userKafkas: CloudKafka[]; conditions: StatusCondition[] };
}

export interface StatusCondition {
  type: string | 'Finished' | 'UserKafkasUpToDate' | 'AcccesTokenSecretValid';
  status: 'True' | 'False';
  message: string;
  reason: string;
}
