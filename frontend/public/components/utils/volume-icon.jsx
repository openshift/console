import * as _ from 'lodash-es';
import * as React from 'react';
import { LockIcon, OutlinedCopyIcon, OutlinedFolderOpenIcon } from '@patternfly/react-icons';

import {VolumeSource} from '../../module/k8s/pods';

export const VolumeIcon = ({kind}) => {
  const icons = {
    [VolumeSource.emptyDir.id]: <OutlinedFolderOpenIcon className="co-icon-and-text__icon" />,
    [VolumeSource.hostPath.id]: <OutlinedCopyIcon className="co-icon-and-text__icon" />,
    [VolumeSource.secret.id]: <LockIcon className="co-icon-and-text__icon" />,
  };
  const icon = icons[kind];

  return <span className="co-icon-and-text">
    {icon}
    {_.get(VolumeSource[kind], 'label', '')}
  </span>;
};
