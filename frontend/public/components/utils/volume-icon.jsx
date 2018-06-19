import * as _ from 'lodash-es';
import * as React from 'react';
import * as classNames from 'classnames';
import {VolumeSource} from '../../module/k8s/pods';

export const VolumeIcon = ({kind}) => {
  const faClasses = _.fromPairs([
    [VolumeSource.emptyDir.id, 'fa-folder-open-o'],
    [VolumeSource.hostPath.id, 'fa-files-o'],
    [VolumeSource.secret.id, 'fa-lock']
  ]);
  const faClass = faClasses[kind];

  return <span className={`co-m-volume-icon co-m-volume-icon--${kind}`}>
    {faClass && <i className={classNames('fa', faClass)}></i>}
    <span>{_.get(VolumeSource[kind], 'label', '')}</span>
  </span>;
};
