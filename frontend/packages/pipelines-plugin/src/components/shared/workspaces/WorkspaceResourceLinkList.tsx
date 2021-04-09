import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceLink } from '@console/internal/components/utils';
import { PersistentVolumeClaimModel, ConfigMapModel, SecretModel } from '@console/internal/models';
import {
  PipelineRunWorkspace,
  VolumeTypeConfigMaps,
  VolumeTypePVC,
  VolumeTypeSecret,
} from '../../../types';
import VolumeClaimTemplatesLink from './VolumeClaimTemplateLink';

export interface WorkspaceResourceLinkListProps {
  workspaces: PipelineRunWorkspace[];
  namespace: string;
  ownerResourceName: string;
  ownerResourceKind?: string;
}

const WorkspaceResourceLinkList: React.FC<WorkspaceResourceLinkListProps> = ({
  workspaces,
  namespace,
  ownerResourceName,
  ownerResourceKind,
}) => {
  const { t } = useTranslation();

  if (!workspaces || workspaces.length === 0) return null;

  const hasOnlyVCTemplates = !workspaces.some((workspace) => !workspace.volumeClaimTemplate);

  const volumeClaimTemplateSection = (
    <VolumeClaimTemplatesLink
      namespace={namespace}
      ownerResourceName={ownerResourceName}
      ownerResourceKind={ownerResourceKind}
    />
  );

  if (hasOnlyVCTemplates) return volumeClaimTemplateSection;

  return (
    <>
      <dl>
        <dt>{t('pipelines-plugin~Workspace Resources')}</dt>
        <dd>
          {workspaces.map((workspace) => {
            if (workspace.persistentVolumeClaim) {
              const persistentVolumeClaim = workspace.persistentVolumeClaim as VolumeTypePVC;
              const displayName = `${persistentVolumeClaim.claimName} (${workspace.name})`;
              return (
                <ResourceLink
                  key={workspace.name}
                  name={persistentVolumeClaim.claimName}
                  namespace={namespace}
                  kind={PersistentVolumeClaimModel.kind}
                  displayName={displayName}
                />
              );
            }
            if (workspace.configMap) {
              const configMap = workspace.configMap as VolumeTypeConfigMaps;
              const displayName = `${configMap.name} (${workspace.name})`;
              return (
                <ResourceLink
                  key={workspace.name}
                  name={configMap.name}
                  namespace={namespace}
                  kind={ConfigMapModel.kind}
                  displayName={displayName}
                />
              );
            }
            if (workspace.secret) {
              const secret = workspace.secret as VolumeTypeSecret;
              const displayName = `${secret.secretName} (${workspace.name})`;
              return (
                <ResourceLink
                  key={workspace.name}
                  name={secret.secretName}
                  kind={SecretModel.kind}
                  namespace={namespace}
                  displayName={displayName}
                />
              );
            }
            if (!workspace.volumeClaimTemplate) {
              return <div key={workspace.name}>{workspace.name}</div>;
            }
            return null;
          })}
        </dd>
      </dl>
      {volumeClaimTemplateSection}
    </>
  );
};

export default WorkspaceResourceLinkList;
