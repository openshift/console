import * as React from 'react';
import * as _ from 'lodash';
import {
  getContainerImageByDisk,
  getURLSourceByDisk,
  getPVCSourceByDisk,
} from '../../selectors/vm/selectors';
import { WINTOOLS_CONTAINER_NAMES } from '../../constants';
import { VMKind } from '../../types';
import { V1Disk } from '../../types/vm/disk/V1Disk';

import './disk-summary.scss';

export const DiskSummary: React.FC<DiskSummaryProps> = ({ disks, vm }) => (
  <dl className="kubevirt-disk-summary">
    {disks.map(({ name }) => {
      const container = getContainerImageByDisk(vm, name);
      const pvc = getPVCSourceByDisk(vm, name);
      const url = getURLSourceByDisk(vm, name);
      const nameKey = `kubevirt-disk-summary-disk-title-${name}`;
      let value = '';

      if (_.includes(WINTOOLS_CONTAINER_NAMES, container)) {
        value = `Windows Tools: ${container}`;
      } else if (container) {
        value = `Container: ${container}`;
      } else if (url) {
        value = `URL: ${url}`;
      } else if (pvc) {
        value = `PVC: ${pvc}`;
      }

      return (
        <React.Fragment key={nameKey}>
          <dt id={nameKey} key={nameKey} className="kubevirt-disk-summary__datalist-dt">
            {name}
          </dt>
          <dd
            id={`${nameKey}-info`}
            key={`${nameKey}-info`}
            className="kubevirt-disk-summary__datalist-dd"
          >
            {value}
          </dd>
        </React.Fragment>
      );
    })}
  </dl>
);

type DiskSummaryProps = {
  vm: VMKind;
  disks: V1Disk[];
};
