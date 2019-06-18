import * as _ from 'lodash';
import * as React from 'react';
import {VolumeSource} from '../../module/k8s/pods';

export const VolumeIcon = ({kind}) => {
  const faClasses = _.fromPairs([
    [VolumeSource.emptyDir.id, 'fa-folder-open-o'],
    [VolumeSource.hostPath.id, 'fa-files-o'],
    [VolumeSource.secret.id, 'fa-lock'],
  ]);
  const faClass = faClasses[kind];

  return <span className="co-icon-and-text co-m-volume-icon">
    {faClass && <i className={`fa ${faClass} co-icon-and-text__icon`}></i>}
    {_.get(VolumeSource[kind], 'label', '')}
  </span>;
};
