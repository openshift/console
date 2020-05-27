import * as React from 'react';
import * as _ from 'lodash';
import ActivityItem, {
  ActivityProgress,
} from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { ResourceLink } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sActivityProps } from '@console/plugin-sdk';
import { TemplateModel } from '@console/internal/models';
import { VirtualMachineModel } from '../../../models';
import { diskImportKindMapping } from './utils';
import { VMTemplateLink } from '../../vm-templates/vm-template-link';

export const DiskImportActivity: React.FC<K8sActivityProps> = ({ resource }) => {
  const progress = parseInt(resource?.status?.progress, 10);
  const { kind, name, uid } = resource.metadata.ownerReferences[0];
  const model = diskImportKindMapping[kind];
  const ownerLink =
    model === TemplateModel ? (
      <VMTemplateLink name={name} namespace={resource.metadata.namespace} uid={uid} />
    ) : (
      <ResourceLink
        kind={referenceForModel(model)}
        name={name}
        namespace={resource.metadata.namespace}
      />
    );
  const title = `Importing ${
    model === TemplateModel ? `${VirtualMachineModel.label} ${model.label}` : model.label
  } disk`;
  return Number.isNaN(progress) ? (
    <>
      <ActivityItem>{title}</ActivityItem>
      {ownerLink}
    </>
  ) : (
    <ActivityProgress title={title} progress={progress}>
      {ownerLink}
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
