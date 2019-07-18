import * as _ from 'lodash';
import { ObjectMetadata } from '@console/internal/module/k8s';

export class SafeMetadata {
  private data: ObjectMetadata;

  constructor(metadata?: ObjectMetadata) {
    const safeMetadata = _.cloneDeep(metadata) || {};

    this.data = {
      ...safeMetadata,
      annotations: safeMetadata.annotations || {},
      labels: safeMetadata.labels || {},
      ownerReferences: safeMetadata.ownerReferences || [],
    };
  }

  build = () => _.cloneDeep(this.data);
}
