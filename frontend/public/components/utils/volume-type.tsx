import * as React from 'react';
import * as _ from 'lodash-es';

import { Volume } from '../../module/k8s';
import { getVolumeLocation, getVolumeType } from '../../module/k8s/pods';
import { ResourceLink } from './resource-link';

export const VolumeType: React.FC<VolumeTypeProps> = ({ volume, namespace }) => {
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
