import type { FC, ReactNode } from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import type { Volume } from '../../module/k8s';
import { getVolumeLocation, getVolumeType } from '../../module/k8s/pods';
import { ResourceLink } from './resource-link';

const ProjectedVolumeSources: FC<{ volume: Volume; namespace: string }> = ({
  volume,
  namespace,
}) => {
  const { t } = useTranslation('public');
  const sources = volume.projected?.sources;
  if (!Array.isArray(sources) || sources.length === 0) {
    return <>{t('Projected')}</>;
  }

  const sourceElements: ReactNode[] = [];
  const usedKeys = new Set<string>();
  const getUniqueKey = (base: string): string => {
    let key = base;
    let counter = 1;
    while (usedKeys.has(key)) {
      key = `${base}-${counter}`;
      counter++;
    }
    usedKeys.add(key);
    return key;
  };

  sources.forEach((source) => {
    if (source.configMap) {
      sourceElements.push(
        <ResourceLink
          key={getUniqueKey(`cm-${source.configMap.name}`)}
          kind="ConfigMap"
          name={source.configMap.name}
          namespace={namespace}
        />,
      );
    } else if (source.secret) {
      sourceElements.push(
        <ResourceLink
          key={getUniqueKey(`secret-${source.secret.name}`)}
          kind="Secret"
          name={source.secret.name}
          namespace={namespace}
        />,
      );
    } else if (source.serviceAccountToken) {
      sourceElements.push(
        <span
          key={getUniqueKey(`sat-${source.serviceAccountToken.path || 'token'}`)}
          className="co-resource-item co-resource-item--inline"
        >
          {t('ServiceAccountToken')}
        </span>,
      );
    } else if (source.downwardAPI) {
      sourceElements.push(
        <span
          key={getUniqueKey('downwardAPI')}
          className="co-resource-item co-resource-item--inline"
        >
          {t('DownwardAPI')}
        </span>,
      );
    } else if (source.clusterTrustBundle) {
      sourceElements.push(
        <span
          key={getUniqueKey(`ctb-${source.clusterTrustBundle.name || 'bundle'}`)}
          className="co-resource-item co-resource-item--inline"
        >
          {t('ClusterTrustBundle')}
        </span>,
      );
    }
  });

  return sourceElements.length > 0 ? <>{sourceElements}</> : <>{t('Projected')}</>;
};

export const VolumeType: FC<VolumeTypeProps> = ({ volume, namespace }) => {
  if (volume) {
    if (volume.secret) {
      return <ResourceLink kind="Secret" name={volume.secret.secretName} namespace={namespace} />;
    }

    if (volume.configMap) {
      return <ResourceLink kind="ConfigMap" name={volume.configMap.name} namespace={namespace} />;
    }

    if (volume.persistentVolumeClaim) {
      return (
        <ResourceLink
          kind="PersistentVolumeClaim"
          name={volume.persistentVolumeClaim.claimName}
          namespace={namespace}
        />
      );
    }

    if (volume.projected) {
      return <ProjectedVolumeSources volume={volume} namespace={namespace} />;
    }
  }

  const type = getVolumeType(volume);
  const loc = _.trim(getVolumeLocation(volume));
  return type ? (
    <>
      {type.label}
      {loc && (
        <>
          {' '}
          (<span className="co-break-word co-select-to-copy">{loc}</span>)
        </>
      )}
    </>
  ) : null;
};

export type VolumeTypeProps = {
  volume: Volume;
  namespace: string;
};
