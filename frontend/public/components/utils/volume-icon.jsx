import React from 'react';
import classNames from 'classnames';

import {k8sEnum} from '../../module/k8s';

export const VolumeIcon = ({kind}) => {
  const kinds = k8sEnum.VolumeSource;

  const faClasses = _.fromPairs([
    [kinds.emptyDir.id, 'fa-folder-open-o'],
    [kinds.hostPath.id, 'fa-files-o'],
    [kinds.secret.id, 'fa-lock']
  ]);
  const faClass = faClasses[kind];

  return <span className={`co-m-volume-icon co-m-volume-icon--${kind}`}>
    {faClass && <i className={classNames('fa', faClass)}></i>}
    <span>{_.get(kinds[kind], 'label', '')}</span>
  </span>;
};
