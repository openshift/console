import * as React from 'react';
import {
  getContainerImageByDisk,
  getURLSourceByDisk,
  getPVCSourceByDisk,
  getWindowsToolsURLByDisk,
} from '../../selectors/vm/selectors';
import { VMKind } from '../../types';
import './_disk-summary.scss';

const DiskSummaryRow: React.FC<DiskSummaryRowProps> = ({ title, value }) => (
  <div className="kubevirt-disk-summary-disk">
    <div className="kubevirt-disk-summary-disk-title">{title}</div>
    <div className="kubevirt-disk-summary-disk-value">{value}</div>
  </div>
);

export const DiskSummary: React.FC<DiskSummaryProps> = ({ disks, vm }) => (
  <div className="kubevirt-disk-summary">
    {disks.map(({ name }, i) => {
      const container = getContainerImageByDisk(vm, name);
      const windowsToolsURL = getWindowsToolsURLByDisk(vm, name);
      const pvc = getPVCSourceByDisk(vm, name);
      const url = getURLSourceByDisk(vm, name);

      if (windowsToolsURL) {
        const isoName = windowsToolsURL.substring(windowsToolsURL.lastIndexOf('/') + 1);
        return (
          <DiskSummaryRow
            key={`disk-summary-${name}`}
            title={`Drive ${i + 1}: Windows Tools`}
            value={isoName}
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
  className?: string;
  vm: VMKind;
  disks: any;
};

type DiskSummaryRowProps = {
  title: string;
  value: string;
};
