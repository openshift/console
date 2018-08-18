import * as _ from 'lodash-es';

export const serviceClassDisplayName = (serviceClass: any): string => _.get(serviceClass, 'spec.externalMetadata.displayName') || _.get(serviceClass, 'spec.externalName');
