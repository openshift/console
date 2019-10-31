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

const DiskSummaryRow: React.FC<DiskSummaryRowProps> = ({ title, value }) => (
  <div className="kubevirt-disk-summary__disk">
    <div id={`kubevirt-disk-summary-disk-title-${title}`}>{title}</div>
    <div id={`kubevirt-disk-summary-disk-value-${value}`}>{value}</div>
  </div>
);

export const DiskSummary: React.FC<DiskSummaryProps> = ({ disks, vm }) => (
  <div className="kubevirt-disk-summary">
    {disks.map(({ name }, i) => {
      const container = getContainerImageByDisk(vm, name);
      const pvc = getPVCSourceByDisk(vm, name);
      const url = getURLSourceByDisk(vm, name);

      if (_.includes(WINTOOLS_CONTAINER_NAMES, container)) {
        return (
          <DiskSummaryRow
            key={`disk-summary-${name}`}
            title={`Drive ${i + 1}: Windows Tools`}
            value={container}
          />
        );
      }
      if (container) {
        return (
          <DiskSummaryRow
            key={`disk-summary-${name}`}
            title={`Drive ${i + 1}: Container`}
            value={container}
          />
        );
      }
      if (url) {
        return (
          <DiskSummaryRow key={`disk-summary-${name}`} title={`Drive ${i + 1}: URL`} value={url} />
        );
      }
      return (
        <DiskSummaryRow key={`disk-summary-${name}`} title={`Drive ${i + 1}: PVC`} value={pvc} />
      );
    })}
  </div>
);

type DiskSummaryProps = {
  vm: VMKind;
  disks: V1Disk[];
};

type DiskSummaryRowProps = {
  title: string;
  value: string;
};
