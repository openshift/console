import * as React from 'react';
import * as _ from 'lodash';
import { ActivityProgress } from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sActivityProps } from '@console/plugin-sdk';
import { VirtualMachineModel } from '../../../models';

export const DiskImportActivity: React.FC<K8sActivityProps> = ({ resource }) => (
  <ActivityProgress
    title="Importing VM disk"
    progress={parseInt(_.get(resource, 'status.progress', 0), 10)}
  >
    <ResourceLink
      kind={referenceForModel(VirtualMachineModel)}
      name={resource.metadata.ownerReferences[0].name}
      namespace={resource.metadata.namespace}
    />
  </ActivityProgress>
);

export const V2VImportActivity: React.FC<K8sActivityProps> = ({ resource }) => {
  const vmName = _.get(resource.metadata.ownerReferences, '[0].name');
  return (
    <ActivityProgress
      title="Importing VM (v2v)"
      progress={parseInt(_.get(resource.metadata.annotations, 'v2vConversionProgress', '0'), 10)}
    >
      {vmName && (
        <ResourceLink
          kind={referenceForModel(VirtualMachineModel)}
          name={vmName}
          namespace={resource.metadata.namespace}
        />
      )}
    </ActivityProgress>
  );
};
