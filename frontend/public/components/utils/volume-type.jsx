import * as _ from 'lodash-es';
import * as React from 'react';
import { VolumeSource } from '../../module/k8s/pods';
import { ResourceLink } from './resource-link';

export const VolumeType = ({kind, name, namespace}) => {
  const faClasses = _.fromPairs([
    [VolumeSource.emptyDir.id, 'fa-folder-open-o'],
    [VolumeSource.hostPath.id, 'fa-files-o'],
  ]);
  const faClass = faClasses[kind];
  const k8sKind = _.get(VolumeSource[kind], 'link');

  if (faClass) {
    return <span className="co-icon-and-text co-m-volume-icon">
      {faClass && <i className={`fa ${faClass} co-icon-and-text__icon`} aria-hidden="true" />}
      {_.get(VolumeSource[kind], 'label')}
    </span>;
  }

  if (name) {
    return <ResourceLink kind={k8sKind} name={name} namespace={namespace} />;
  }

  return null;
};
