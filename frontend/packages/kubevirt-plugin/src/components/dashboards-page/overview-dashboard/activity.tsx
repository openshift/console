import * as React from 'react';
import * as _ from 'lodash';
import ActivityItem, {
  ActivityProgress,
} from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sActivityProps } from '@console/plugin-sdk';
import { VirtualMachineModel } from '../../../models';

const VM_IMPORT_TITLE = 'Importing VM disk';

export const DiskImportActivity: React.FC<K8sActivityProps> = ({ resource }) => {
  const progress = parseInt(resource?.status?.progress, 10);
  const vmLink = (
    <ResourceLink
      kind={referenceForModel(VirtualMachineModel)}
      name={resource.metadata.ownerReferences[0].name}
      namespace={resource.metadata.namespace}
    />
  );
  return Number.isNaN(progress) ? (
    <>
      <ActivityItem>{VM_IMPORT_TITLE}</ActivityItem>
      {vmLink}
    </>
  ) : (
    <ActivityProgress title={VM_IMPORT_TITLE} progress={progress}>
      {vmLink}
    </ActivityProgress>
  );
};

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
