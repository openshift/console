import * as React from 'react';
import * as _ from 'lodash';
import { ResourceLink } from '@console/internal/components/utils';
import { PodModel, TemplateModel } from '@console/internal/models';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sActivityProps } from '@console/plugin-sdk';
import ActivityItem, {
  ActivityProgress,
} from '@console/shared/src/components/dashboard/activity-card/ActivityItem';
import { DataVolumeModel, VirtualMachineModel } from '../../../models';
import { getName } from '../../../selectors';
import { VMTemplateLink } from '../../vm-templates/vm-template-link';
import { diskImportKindMapping } from './utils';

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

export const getTimestamp = (resource) => new Date(resource.metadata.creationTimestamp);

export const isDVActivity = (resource) =>
  resource?.status?.phase === 'ImportInProgress' &&
  Object.keys(diskImportKindMapping).includes(resource?.metadata?.ownerReferences?.[0]?.kind);

export const isPodActivity = (resource) => getName(resource).startsWith('kubevirt-v2v-conversion');

export const k8sDVResource = {
  isList: true,
  kind: DataVolumeModel.kind,
  prop: 'dvs',
};

export const k8sPodResource = {
  isList: true,
  kind: PodModel.kind,
  prop: 'pods',
};
