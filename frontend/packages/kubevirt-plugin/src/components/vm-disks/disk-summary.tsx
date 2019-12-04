import * as React from 'react';
import * as _ from 'lodash';
import {
  getContainerImageByDisk,
  getURLSourceByDisk,
  getPVCSourceByDisk,
} from '../../selectors/vm/selectors';
import { WINTOOLS_CONTAINER_NAMES } from '../modals/cdrom-vm-modal/constants';
import { VMKind } from '../../types';
import { V1Disk } from '../../types/vm/disk/V1Disk';

import './disk-summary.scss';

export const DiskSummary: React.FC<DiskSummaryProps> = ({ disks, vm }) => (
  <dl className="oc-vm-details__datalist kubevirt-disk-summary">
    {disks.map(({ name }) => {
      const container = getContainerImageByDisk(vm, name);
      const pvc = getPVCSourceByDisk(vm, name);
      const url = getURLSourceByDisk(vm, name);
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

      const nameKey = `kubevirt-disk-summary-disk-title-${name}`;
      const valueKey = `kubevirt-disk-summary-disk-title-${value}`;

      return (
        <>
          <dt id={nameKey} key={nameKey}>
            {name}
          </dt>
          <dd
            id={valueKey}
            key={valueKey}
            className="co-vm-details-cd-roms--datalist--dd text-secondary"
          >
            {value}
          </dd>
        </>
      );
    })}
  </dl>
);

type DiskSummaryProps = {
  vm: VMKind;
  disks: V1Disk[];
};
